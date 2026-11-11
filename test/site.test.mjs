import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { comprobarDatos, enlaceSeguro } from "../data-model.js";
import { fusionar } from "../scripts/sync-sheets.mjs";
const datos = JSON.parse(readFileSync(new URL("../data/public.json",import.meta.url),"utf8"));

test("el extracto inicial cumple el contrato público", () => {
  assert.equal(comprobarDatos(datos).version,1);
  assert.equal(datos.semanas[0].id,"2026-W46");
});
test("URLs fuera de los dominios autorizados no se publican", () => {
  assert.equal(enlaceSeguro("javascript:alert(1)"),false);
  assert.equal(enlaceSeguro("https://example.com/archivo"),false);
  assert.equal(enlaceSeguro("https://docs.google.com.ejemplo.org/a"),false);
  assert.equal(enlaceSeguro("https://docs.google.com/document/d/123"),true);
});
test("se rechazan estados no reconocidos", () => {
  const copia=structuredClone(datos);
  copia.semanas[0].estado="Listo al 100%";
  assert.throws(()=>comprobarDatos(copia),/estado de semana/);
});
test("la sincronización importa solo campos de gestión, no URLs del Sheet", () => {
  const r=[
    ["Situación","Diseño en revisión"],
    ["Último avance","Reunión con minuta"],
    ["Siguiente entrega","Nueva consola"],
    ["Puntos abiertos","Publicación pendiente"],
    ["Fuera del alcance inmediato","Multicuenta"]
  ];
  const s=[
    ["Semana","Fechas","Objetivo","Resultado","Estado","URL privada","Siguiente","URL evidencia"],
    ["2026-W46","09 al 15 de nov.","Revisión de diseño","Minuta disponible","En curso","https://example.com/privado","Cerrar prueba","https://example.com/secreto"],
    ["2026-W47","16 al 22 de nov.","Crear demostración","Sin verificación","No iniciado","","Revisar avances",""]
  ];
  const nuevo=fusionar(datos,r,s);
  assert.equal(nuevo.resumen.situacion,"Diseño en revisión");
  assert.equal(nuevo.semanas.length,2);
  assert.deepEqual(nuevo.semanas[0].evidencias,datos.semanas[0].evidencias);
  assert.equal(JSON.stringify(nuevo).includes("example.com"),false);
});
test("una semana nueva no hereda evidencias ajenas", () => {
  const r=Object.entries({
    "Situación":"S","Último avance":"A","Siguiente entrega":"N","Puntos abiertos":"P","Fuera del alcance inmediato":"F"
  });
  const s=[["Semana"],["2026-W49","30 nov. al 6 dic.","Definir integración","Sin verificación","No iniciado","","Revisar"]];
  const nuevo=fusionar(datos,r,s);
  assert.deepEqual(nuevo.semanas[0].evidencias,[]);
});
test("no hay promesas comerciales ni cifras de rendimiento sin fuente en la portada", () => {
  const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  assert.match(html,/<html lang="es">/);
  assert.doesNotMatch(html,/10x|revolucionario|líder del mercado|sin esfuerzo/i);
});
