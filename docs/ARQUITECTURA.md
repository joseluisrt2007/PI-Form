# Arquitectura de Py-Form-Manager Web

Aplicación web **estática** (HTML + CSS + JavaScript puro). No necesita servidor, ni
Node, ni compilación: se abre haciendo doble clic en `index.html` (protocolo `file://`).
Por eso **no se usan módulos ES** (`import/export`, que el navegador bloquea en `file://`):
cada archivo JS se carga con `<script>` clásico y se comunica mediante el objeto global `PFM`.

## Estructura

```
index.html … resultados.html   12 páginas (en la raíz: las URLs no cambian)
css/
  base.css                     estilos comunes a todas las páginas (variables, cabecera, botones…)
  pages/<pagina>.css           solo lo específico de cada página
  components/asistente.css     panel del asistente IA (necesidades, ideas, evaluacion)
i18n/
  es.js / en.js                textos de la interfaz (PFM.translations.es / .en) – 141 claves cada uno
  pdf.js                       textos del informe PDF (PFM.pdfStrings)
  resultados.js                textos propios de la página resultados (PFM.resultadosStrings)
js/
  core/                        infraestructura común
    i18n.js      PFM.i18n      t(), setLanguage(), applyTranslations() (atributos data-i18n)
    storage.js   PFM.storage   load()/save()/ensure() de localStorage['projectData']
    html.js      PFM.html      escape(): úsalo para todo texto de usuario que vaya en innerHTML/atributos
    theme.js     PFM.theme     tema claro/oscuro
    flow.js      PFM.flow      navegación dinámica (FLOW_STEPS)
    page.js      PFM.page      init(): idioma, tema, nombre de proyecto, Guardar/Continuar/Regreso
    file-io.js   PFM.fileIO    descargar/leer archivos .txt
  shared/                      lógica usada por varias páginas (elementos.js, scoring.js)
  pages/<pagina>.js            lógica de cada página (una IIFE que corre en DOMContentLoaded)
  features/assistant.js        asistente IA (lee data-page del <script>)
  pdf/                         generador del informe PDF (jsPDF)
    context.js  report.js  grupos.js  evaluacion-elementos.js
    sections/*.js              una sección del informe por archivo
api/assistant.js               función serverless (Vercel, Gemini). Solo el asistente la usa.
docs/                          esta documentación
```

## Orden de carga de scripts (importante)

Como no hay `import`, **el orden de los `<script>` es la gestión de dependencias**.
Todas las páginas siguen el mismo patrón (cada archivo asume que los anteriores ya cargaron):

1. `i18n/es.js`, `i18n/en.js`
2. `js/core/i18n.js`, `storage.js`, `html.js`, `theme.js`, `flow.js`, `page.js`
3. (si aplica) `js/core/file-io.js`, `js/shared/*.js`
4. `js/pages/<pagina>.js`
5. (si aplica) `js/features/assistant.js` con `data-page="<pagina>"`

`resultados.html` además carga jsPDF (CDN, en `<head>`), `i18n/pdf.js`, `i18n/resultados.js`,
`js/pdf/*` y todas las secciones **antes** de `js/pdf/report.js`.

Cada módulo tiene la forma:

```js
(function (PFM) {
  'use strict';
  PFM.miModulo = { ... };
})(window.PFM = window.PFM || {});
```

## Estado del proyecto (localStorage)

Todo vive en `localStorage['projectData']` (JSON plano). Fuera de él solo hay
preferencias: `theme` (`light`/`dark`) y `preferredLanguage` (`es`/`en`).
**No renombres estas claves**: rompería los proyectos ya guardados en los navegadores.

| Clave(s) | Contenido | Página que la escribe |
|---|---|---|
| `projectName`, `projectDescription`, `modulosSeleccionados` | datos generales y módulos elegidos | descripcion |
| `criterioN`, `pesoN`, `numCriterios` | criterios y pesos | necesidades |
| `conceptoN` | ideas | ideas |
| `eval_resultado_*`, `resultado…` | puntuaciones de evaluación de ideas/funciones | evaluacion |
| `personaN`, `salidaN`, `tareaN` | diagrama de entradas/salidas y funciones | diagrama |
| `elementosAEvaluar` | ideas/funciones elegidas para explorar (`[{idx,nombre,tipo}]`) | seleccionEvaluar |
| `pos_<tipo>_<idx>_<fila>` | opciones de morfología | morfologia |
| `fila_grupo_<tipo>_<idx>_colK` | NÚMERO de fila (1..3) elegida por concepto formado; leer con `PFM.elementos.getOpcionElegida` (formato antiguo `pastel_grupo_*` = texto, se migra solo) | gc1 |
| `eval_concepto_<n>_critK`, `caN`, `calculadoFormadoN` | evaluación de conceptos formados | evalConceptos |
| `sevN`, `ocuN`, `riesgoN`, `fallaPotencialN`, `efectoN`, `accionTomN`, `accionRealN`, `responsableN`, `fechaN`, `fechaCellN`, `numeroPrevenciones`, `numeroTareas` | prevención de riesgos | prevenir |

## Cómo se hace…

**Agregar una página al flujo:** crea `nueva.html` (copia una existente), `css/pages/nueva.css`,
`js/pages/nueva.js` (usa `PFM.page.init({...})`) y añade una fila a `FLOW_STEPS` en `js/core/flow.js`.

**Agregar una sección al PDF:** crea `js/pdf/sections/<nombre>.js` con
`PFM.pdf.sections.<nombre> = { enabled(modulos), render(ctx) }`, cárgalo en `resultados.html`
antes de `report.js` y añade `'<nombre>'` a `ORDEN` en `js/pdf/report.js`.

**Agregar/cambiar un texto:** añade la clave en `i18n/es.js` **y** `i18n/en.js`; en HTML usa
`data-i18n="clave"`, en JS `PFM.i18n.t('clave')`. Para el PDF: `i18n/pdf.js`.

**Cambiar estilos comunes:** `css/base.css`. Estilos de una sola página: `css/pages/<pagina>.css`.
(Nota: `base.css` se carga primero; las páginas pueden sobrescribirlo. Desde esta versión incluye también los componentes compartidos de la cabecera y los botones: `.language-selector`, `.theme-toggle`, `.btn-primary`, `.btn-secondary`, `.btn-file-action`, `.btn-calc`, con sus variantes oscuras y responsive. CUIDADO: cambiar un valor ahí afecta a todas las páginas que no lo sobrescriban.)

**Asistente IA:** ver `ASISTENTE_IA_SETUP.md`. Solo funciona desplegado en Vercel; el resto de la
app funciona sin servidor.

## Convención de comentarios (cómo leer el código)

Todo el código (JS, CSS y HTML) está comentado en español. Cada archivo empieza con una cabecera
que dice qué hace, qué expone, de qué depende y qué claves de `projectData` usa. Dos etiquetas
permiten encontrar rápido lo importante (búscalas con el buscador del editor o `grep -rn`):

- `CONFIGURABLE:` valor que se puede cambiar a propósito (límites, colores, tamaños, claves, URLs,
  modelo de IA…), con el efecto y los otros archivos que hay que cambiar a la vez.
- `CUIDADO:` algo frágil (ids que usa JS, orden de scripts, dependencias entre archivos) o un
  problema conocido que no se corrigió.

Ejemplos: `grep -rn "CONFIGURABLE" js/` · `grep -rn "CUIDADO (problema conocido)" .`
Al agregar código nuevo, mantén esta convención. Todo texto escrito por el usuario que se inserte en
`innerHTML` o en un atributo debe pasar por `PFM.html.escape()`.

## Cómo probar

Abrir `index.html` en el navegador y recorrer el flujo. No hay suite de pruebas automáticas;
esta reorganización se verificó con Playwright comparando capturas, `localStorage`, PDF
generado y estilos computados contra la versión original.
