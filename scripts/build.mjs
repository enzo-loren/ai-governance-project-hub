import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { comprobarDatos } from "../data-model.js";

const datos = JSON.parse(readFileSync("data/public.json", "utf8"));
comprobarDatos(datos);
rmSync("dist", { recursive:true, force:true });
mkdirSync(join("dist", "data"), { recursive:true });
for (const archivo of ["index.html", "styles.css", "app.js", "data-model.js", "favicon.svg"]) {
  cpSync(archivo, join("dist", archivo));
}
writeFileSync(join("dist", "data/public.json"), JSON.stringify(datos, null, 2) + "\n");
console.log("Sitio estático listo en dist/. No se han publicado datos de Drive.");
