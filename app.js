import { comprobarDatos, enlaceSeguro } from "./data-model.js";

const CONTENEDOR = document.querySelector("#app");
const elemento = (tag, clase, texto) => {
  const nodo = document.createElement(tag);
  if (clase) nodo.className = clase;
  if (texto !== undefined) nodo.textContent = texto;
  return nodo;
};
function anadirEnlace(destino, texto, url, clase) {
  if (!enlaceSeguro(url)) return;
  const link = elemento("a", clase, texto);
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  destino.append(link);
}
function encabezado(numero, titulo, descripcion) {
  const fila = elemento("div", "section-heading");
  const izquierda = elemento("div");
  izquierda.append(elemento("span", "section-index", numero), elemento("h2", "", titulo));
  fila.append(izquierda);
  if (descripcion) fila.append(elemento("p", "section-hint", descripcion));
  return fila;
}
function resumen(datos) {
  const seccion = elemento("section", "section");
  seccion.id = "estado";
  seccion.append(encabezado("01 / ESTADO", "Lo que se puede revisar hoy", "Cada afirmación corresponde a un registro o una entrega identificable."));
  const tarjetas = elemento("div", "overview-grid");
  [
    ["01", "Situación", datos.resumen.situacion],
    ["02", "Último avance", datos.resumen.avance],
    ["03", "Siguiente entrega", datos.resumen.siguiente]
  ].forEach(([numero, titulo, texto]) => {
    const tarjeta = elemento("article", "overview-card");
    tarjeta.append(elemento("span", "card-number", numero), elemento("h3", "", titulo), elemento("p", "", texto));
    tarjetas.append(tarjeta);
  });
  seccion.append(tarjetas);
  const aviso = elemento("div", "risk-strip");
  aviso.append(elemento("strong", "", "Por comprobar"), elemento("p", "", datos.resumen.pendiente));
  seccion.append(aviso);
  return seccion;
}
function semanas(datos) {
  const seccion = elemento("section", "section");
  seccion.id = "semanas";
  seccion.append(encabezado("02 / REGISTRO", "Semana por semana", "Abre una semana para ver el objetivo, el avance registrado y los documentos."));
  const lista = elemento("div", "week-list");
  const ordenadas = [...datos.semanas].sort((a,b) => b.id.localeCompare(a.id));
  ordenadas.forEach((semana, indice) => {
    const fila = elemento("details", "week-entry");
    if (semana.estado === "En curso" || (indice === 0 && !ordenadas.some(x => x.estado === "En curso"))) fila.open = true;
    const cabecera = elemento("summary");
    const id = elemento("span", "week-id", semana.id);
    const tema = elemento("span");
    tema.append(elemento("span", "week-topic", semana.objetivo), elemento("span", "week-period", semana.periodo));
    const slug = semana.estado === "En curso" ? "en-curso" : semana.estado === "Completado" ? "completado" : semana.estado === "Bloqueado" ? "bloqueado" : "";
    cabecera.append(id, tema, elemento("span", "status " + slug, semana.estado), elemento("span", "chevron", "+"));
    const cuerpo = elemento("div", "week-body");
    [["Resultado registrado",semana.resultado],["Próxima acción",semana.proximo]].forEach(([rotulo, valor]) => {
      const grupo = elemento("div");
      grupo.append(elemento("span", "small-label", rotulo), elemento("p", "", valor));
      cuerpo.append(grupo);
    });
    const pruebas = elemento("div", "week-evidence");
    pruebas.append(elemento("span", "small-label", "Evidencias"));
    if (!semana.evidencias.length) {
      pruebas.append(elemento("span", "muted", "Sin enlaces aprobados para esta semana."));
    } else {
      semana.evidencias.forEach(item => anadirEnlace(pruebas, item.texto + " ↗", item.url, "evidence-link"));
    }
    cuerpo.append(pruebas);
    fila.append(cabecera, cuerpo);
    lista.append(fila);
  });
  seccion.append(lista);
  return seccion;
}
function hitos(datos) {
  const seccion = elemento("section", "section");
  seccion.id = "hitos";
  seccion.append(encabezado("03 / ALCANCE", "Capacidades previstas", "El recorrido S0–S6 corresponde al diseño de la plataforma."));
  const cuadricula = elemento("div", "milestones");
  datos.hitos.forEach(h => {
    const tarjeta = elemento("article", "milestone");
    tarjeta.append(elemento("strong", "", h.id), elemento("h3", "", h.nombre), elemento("p", "", h.alcance), elemento("small", "", h.estado));
    cuadricula.append(tarjeta);
  });
  seccion.append(cuadricula, elemento("p", "context-note", datos.resumen.fuera));
  return seccion;
}
function fuentes(datos) {
  const seccion = elemento("section", "section");
  seccion.id = "fuentes";
  seccion.append(encabezado("04 / DOCUMENTOS", "Ir a la evidencia", "El detalle técnico y las minutas se mantienen en sus repositorios originales."));
  const enlaces = elemento("div", "sources");
  datos.fuentes.forEach(f => {
    if (!enlaceSeguro(f.url)) return;
    const link = elemento("a", "source-item");
    link.href = f.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.append(elemento("span", "", f.texto), elemento("span", "", "↗"));
    enlaces.append(link);
  });
  seccion.append(enlaces, elemento("p", "source-caption", datos.origen));
  return seccion;
}
function pintar(datos) {
  document.title = "Seguimiento del proyecto | AI Governance Platform";
  const hero = elemento("section", "hero");
  hero.id = "inicio";
  const columna = elemento("div");
  columna.append(elemento("p", "eyebrow", "Informe de proyecto / 2026"), elemento("h1", "", "Estado del trabajo en gobernanza de agentes"), elemento("p", "intro", "Avances registrados, compromisos de la próxima revisión y documentos que permiten comprobarlos."));
  const meta = elemento("div", "metadata");
  meta.append(elemento("span", "chip", datos.fase), elemento("span", "date", "Corte del registro: " + new Intl.DateTimeFormat("es-CL", {day:"numeric",month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(datos.corte + "T12:00:00Z"))));
  columna.append(meta);
  const panel = elemento("aside", "next-panel");
  panel.append(elemento("p", "next-label", "Próximo control"), elemento("h2", "next-title", "Un prototipo que se pueda recorrer"), elemento("p", "next-copy", datos.resumen.siguiente), elemento("p", "next-footer", "Alcance acordado: demostración con conexiones simuladas."));
  hero.append(columna,panel);
  CONTENEDOR.replaceChildren(hero, resumen(datos), semanas(datos), hitos(datos), fuentes(datos));
}
async function cargar() {
  try {
    const respuesta = await fetch("./data/public.json", {cache: "no-cache"});
    if (!respuesta.ok) throw new Error("No se pudo leer el archivo de datos");
    pintar(comprobarDatos(await respuesta.json()));
  } catch (error) {
    console.error("Error de carga:", error);
    const parrafo = elemento("p", "error", "No se pudo cargar el seguimiento. El resumen sigue disponible en Drive.");
    const enlace = elemento("p");
    anadirEnlace(enlace, "Abrir el resumen ejecutivo en Drive ↗", "https://docs.google.com/document/d/1YSE4pDKGdZJKuJ8G8JEzGbMRwxKGOJYFvGpSLkXPqQs/edit", "source-link");
    CONTENEDOR.replaceChildren(parrafo, enlace);
  }
}
cargar();
