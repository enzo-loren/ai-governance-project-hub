// Contrato de datos de la publicación. La hoja original nunca se entrega al navegador.
export const ESTADOS = ["No iniciado", "En curso", "Completado", "Bloqueado"];
const DOMINIOS = new Set(["docs.google.com", "drive.google.com", "github.com", "enzo-loren.github.io"]);
export function enlaceSeguro(valor) {
  if (typeof valor !== "string") return false;
  try {
    const url = new URL(valor);
    return url.protocol === "https:" && !url.username && !url.password && DOMINIOS.has(url.hostname);
  } catch {
    return false;
  }
}
export function comprobarDatos(datos) {
  if (!datos || datos.version !== 1) throw new Error("Versión de datos no admitida");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datos.corte)) throw new Error("Fecha de corte incorrecta");
  const campos = ["situacion", "avance", "siguiente", "pendiente", "fuera"];
  if (!datos.resumen || campos.some(c => typeof datos.resumen[c] !== "string" || !datos.resumen[c].trim() || datos.resumen[c].length > 750)) {
    throw new Error("El resumen tiene campos faltantes o demasiado extensos");
  }
  if (!Array.isArray(datos.semanas) || datos.semanas.length > 80) throw new Error("Lista de semanas incorrecta");
  if (!Array.isArray(datos.hitos) || datos.hitos.length > 20) throw new Error("Lista de hitos incorrecta");
  if (!Array.isArray(datos.fuentes) || datos.fuentes.length > 12) throw new Error("Lista de fuentes incorrecta");
  const semanas = new Set();
  for (const s of datos.semanas) {
    if (!/^\d{4}-W\d{2}$/.test(s.id) || semanas.has(s.id) || !ESTADOS.includes(s.estado)) throw new Error("ID o estado de semana incorrecto");
    semanas.add(s.id);
    for (const c of ["periodo", "objetivo", "resultado", "proximo"]) {
      if (typeof s[c] !== "string" || !s[c].trim() || s[c].length > 700) throw new Error("Campo semanal incorrecto: " + c);
    }
    if (!Array.isArray(s.evidencias) || s.evidencias.length > 8 || s.evidencias.some(e => !e.texto || !enlaceSeguro(e.url))) {
      throw new Error("Evidencia no aprobada");
    }
  }
  for (const h of datos.hitos) {
    if (!/^S[0-9]{1,2}$/.test(h.id) || typeof h.nombre !== "string" || typeof h.alcance !== "string" || typeof h.estado !== "string") {
      throw new Error("Hito inválido");
    }
  }
  for (const f of datos.fuentes) {
    if (typeof f.texto !== "string" || !enlaceSeguro(f.url)) throw new Error("Fuente sin enlace permitido");
  }
  return datos;
}
