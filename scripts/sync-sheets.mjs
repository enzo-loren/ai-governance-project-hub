// Sincronización manual con Google Sheets. Nunca publica un rango ni un documento completo.
// Campos exportados: resumen A4:B8 y seguimiento semanal A8:H100 (solo A-D, E y G).
// Los enlaces aprobados siguen definidos en data/public.json; no se importan URLs del Sheet.
import { createSign } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { comprobarDatos, ESTADOS } from "../data-model.js";

const ID_HOJA = "1EyeB23_IDt5kCVavyau5-DgudK7tN2CIrFjK2FEKAnE";
const ARCHIVO = "data/public.json";
const VALORES = {
  "Situación": "situacion",
  "Último avance": "avance",
  "Siguiente entrega": "siguiente",
  "Puntos abiertos": "pendiente",
  "Fuera del alcance inmediato": "fuera"
};
function texto(v, limite = 750) {
  if (typeof v !== "string" || !v.trim() || v.length > limite) {
    throw new Error("La hoja contiene un texto vacío o demasiado extenso");
  }
  return v.trim();
}
function codificar(payload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}
async function tokenDeServicio() {
  const contenido = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!contenido) throw new Error("Falta el secreto GOOGLE_SERVICE_ACCOUNT_JSON");
  let credenciales;
  try { credenciales = JSON.parse(contenido); }
  catch { throw new Error("El secreto no es JSON válido"); }
  if (credenciales.type !== "service_account" || !credenciales.client_email || !credenciales.private_key) {
    throw new Error("El secreto no contiene una cuenta de servicio válida");
  }
  const ahora = Math.floor(Date.now() / 1000);
  const header = codificar({ alg: "RS256", typ: "JWT" });
  const payload = codificar({
    iss: credenciales.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: ahora,
    exp: ahora + 3000
  });
  const cabecera = header + "." + payload;
  const firma = createSign("RSA-SHA256").update(cabecera).sign(credenciales.private_key, "base64url");
  const respuesta = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {"Content-Type":"application/x-www-form-urlencoded"},
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: cabecera + "." + firma
    }),
    signal: AbortSignal.timeout(20000)
  });
  if (!respuesta.ok) throw new Error("Falló la autenticación con Google Sheets (" + respuesta.status + ")");
  const body = await respuesta.json();
  if (!body.access_token) throw new Error("Google no devolvió un token de acceso");
  return body.access_token;
}
async function leer(token, rango) {
  const url = "https://sheets.googleapis.com/v4/spreadsheets/" + ID_HOJA
    + "/values/" + encodeURIComponent(rango) + "?valueRenderOption=FORMATTED_VALUE";
  const respuesta = await fetch(url, {
    headers: {Authorization:"Bearer " + token},
    signal: AbortSignal.timeout(20000)
  });
  if (!respuesta.ok) throw new Error("No se pudo leer el rango aprobado (" + respuesta.status + ")");
  const datos = await respuesta.json();
  return datos.values || [];
}
export function fusionar(basico, filasResumen, filasSemana) {
  const datos = structuredClone(comprobarDatos(basico));
  const resumen = new Map(filasResumen.filter(f=>Array.isArray(f)&&f.length>=2).map(f=>[f[0],f[1]]));
  for (const [etiqueta, campo] of Object.entries(VALORES)) {
    if (!resumen.has(etiqueta)) throw new Error("Falta el campo ejecutivo: " + etiqueta);
    datos.resumen[campo] = texto(resumen.get(etiqueta));
  }
  // El Sheet es la fuente del contenido. Un enlace nuevo necesita aprobación editorial.
  const previas = new Map(datos.semanas.map(s=>[s.id,s]));
  const semanas = filasSemana.slice(1).filter(row=>/^\d{4}-W\d{2}$/.test(row[0]||""));
  if (!semanas.length || semanas.length > 80) throw new Error("No se encontraron semanas para publicar");
  datos.semanas = semanas.map(row => {
    const id = texto(row[0],20);
    const estado = texto(row[4],40);
    if (!ESTADOS.includes(estado)) throw new Error("Estado semanal desconocido: " + estado);
    const anterior = previas.get(id);
    return {
      id,
      periodo: texto(row[1],100),
      estado,
      objetivo: texto(row[2]),
      resultado: texto(row[3]),
      proximo: texto(row[6]),
      // No importar URLs de un Sheet privado al sitio público.
      evidencias: anterior ? anterior.evidencias : []
    };
  });
  datos.corte = new Date().toISOString().slice(0,10);
  datos.origen = "Datos seleccionados de Google Sheets. Publicación manual tras revisar el contenido.";
  return comprobarDatos(datos);
}
async function principal() {
  if (process.env.CONFIRMAR_PUBLICACION !== "PUBLICAR") {
    throw new Error("La sincronización requiere CONFIRMAR_PUBLICACION=PUBLICAR");
  }
  const anterior = JSON.parse(readFileSync(ARCHIVO, "utf8"));
  const token = await tokenDeServicio();
  const [resumen, semanas] = await Promise.all([
    leer(token,"'Resumen ejecutivo'!A4:B8"),
    leer(token,"'Resumen semanal'!A8:H100")
  ]);
  const nuevo = fusionar(anterior, resumen, semanas);
  writeFileSync(ARCHIVO, JSON.stringify(nuevo, null, 2) + "\n");
  console.log("Extracto validado. Revisar el diff antes de desplegar.");
}
if (process.argv[1]?.endsWith("sync-sheets.mjs")) {
  principal().catch(error => {console.error(error.message);process.exitCode=1;});
}
