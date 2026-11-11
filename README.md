# Seguimiento de AI Governance Platform

Sitio estático para la revisión semanal del proyecto. La primera pantalla permite conocer el estado, el último avance y el próximo compromiso. El detalle se consulta por semana o hito.

La página está en español. La interfaz del producto se documenta por separado.

## Qué muestra

- **Estado:** situación, último avance, siguiente compromiso y aspectos por comprobar.
- **Semanas:** objetivo, resultado acreditado, próxima acción y evidencias aprobadas.
- **Hitos S0–S6:** alcance previsto. El rótulo «Concepto / demo» evita confundir diseño con implementación.
- **Fuentes:** enlaces al Drive, a la documentación y al repositorio del producto.

El extracto inicial procede del [resumen ejecutivo del 11 de noviembre de 2026](https://docs.google.com/document/d/1YSE4pDKGdZJKuJ8G8JEzGbMRwxKGOJYFvGpSLkXPqQs/edit) y del [registro maestro de seguimiento](https://docs.google.com/spreadsheets/d/1EyeB23_IDt5kCVavyau5-DgudK7tN2CIrFjK2FEKAnE/edit). La existencia de un prototipo visual archivado no acredita su despliegue público ni conexiones productivas.

## Ejecutar localmente

Requiere Node.js 22 o posterior. No utiliza dependencias npm externas.

~~~sh
npm test
npm run build
python3 -m http.server 8000 --directory dist
~~~

Abrir http://localhost:8000. También se puede servir la raíz del repositorio con un servidor HTTP. Abrir index.html directamente desde el disco puede bloquear la lectura del archivo JSON.

Los archivos publicados quedan en dist. Todas las rutas son relativas para funcionar en una URL de proyecto de GitHub Pages.

## Publicar en GitHub Pages (manual)

1. Revisar la pull request y fusionarla en main.
2. Entrar a Settings > Pages > Build and deployment y elegir **GitHub Actions**.
3. Entrar a Actions y ejecutar **Publicar en GitHub Pages** con Run workflow.
4. Comprobar el resultado del workflow y abrir la URL que entregue GitHub.
5. Revisar escritorio, móvil, enlaces, textos y el aviso sobre simulaciones.

El flujo de Pages **solo se ejecuta manualmente**. Tenerlo en el repositorio no significa que Pages esté activado.

## Conectar el registro maestro de Google Sheets

La página consume el archivo público data/public.json. **El navegador no accede a Google Drive**, no se publica el Sheet completo y no se incluye ninguna credencial.

Hay dos modos de mantenimiento:

- **Inicial, sin credenciales:** el sitio muestra el extracto revisado que ya está versionado en Git. Basta para el primer despliegue.
- **Sincronización manual:** un workflow lee campos definidos del Google Sheet y actualiza data/public.json. Un responsable revisa después el commit antes de volver a publicar Pages.

Para habilitar la sincronización:

1. Crear una cuenta de servicio en Google Cloud y habilitar Google Sheets API.
2. Compartir únicamente el [registro maestro](https://docs.google.com/spreadsheets/d/1EyeB23_IDt5kCVavyau5-DgudK7tN2CIrFjK2FEKAnE/edit) con el correo de la cuenta de servicio, en modo lector.
3. Guardar el JSON de esa cuenta en Settings > Secrets and variables > Actions como secreto llamado **GOOGLE_SERVICE_ACCOUNT_JSON**.
4. Revisar que el contenido aprobado del Sheet no incluya datos reservados.
5. En Actions ejecutar **Actualizar extracto desde Sheets**, escribiendo **PUBLICAR** cuando lo solicite.
6. Revisar el diff del commit que actualiza data/public.json. Luego ejecutar la publicación manual en Pages.

No habilitar «Publicar toda la hoja en la web». No poner credenciales en el código, en data o en archivos versionados.

### Qué campos pasan de Drive a Pages

| Origen | Se publica | No se exporta |
| --- | --- | --- |
| Resumen ejecutivo, A4:B8 | Situación, último avance, próxima entrega, puntos abiertos y fuera de alcance | Otras filas |
| Resumen semanal, A8:H100 | Semana, periodo, objetivo, resultado, estado y próxima acción | Columnas F y H, que contienen URLs |
| Fuentes y evidencias | Enlaces seleccionados y versionados en data/public.json | Enlaces nuevos sin revisión |

Una semana nueva se muestra sin enlaces de evidencia hasta su aprobación expresa mediante PR. Las semanas existentes conservan únicamente los enlaces ya revisados y versionados. El script comprueba estados válidos y límites de longitud. El navegador inserta el texto sin interpretarlo como HTML.

**Precaución:** GitHub Pages publica el contenido de forma abierta. Una cuenta de servicio con acceso de lectura reduce permisos sobre el Sheet, pero no evita que se exponga información que alguien haya escrito en una celda aprobada. El paso PUBLICAR no sustituye la revisión editorial del diff.

## Flujo semanal

1. Actualizar compromisos y acuerdos en Google Drive, que conserva la fuente de verdad.
2. Verificar el resultado del trabajo con enlaces a PR, commits, pruebas o documentos.
3. Revisar qué información puede publicarse.
4. Sincronizar si se utiliza Google Sheets y comprobar el diff.
5. Desplegar Pages y compartir el enlace con gerencia.

Los estados del registro describen lo documentado. Una interfaz navegable no constituye evidencia de integraciones operativas en AWS.

## Criterio editorial

El lector inicial dispone de poco tiempo. La página indica lo acordado, lo presentado y lo que falta verificar. No usa cifras de impacto, insignias de madurez ni promesas de capacidad sin fuente.

Para la redacción se aplicaron criterios de [Scientific Writing Editor](https://github.com/openai), [anti-slop-copy](https://github.com/Quegenx/agent-skills/blob/main/skills/anti-ai-slop/anti-slop-copy/SKILL.md) y [humanize](https://github.com/ameenmo/humanize-skill), únicamente como guía de claridad, precisión y economía de palabras. Ninguno se usa para atribuir autoría.

## Qué se prueba

npm test comprueba el esquema público, las URLs autorizadas, estados válidos y el comportamiento de la sincronización selectiva. npm run build prepara la versión estática.

Estas pruebas no sustituyen una evaluación visual en navegador, una auditoría formal de accesibilidad o una sesión de usabilidad con los responsables de la revisión.
