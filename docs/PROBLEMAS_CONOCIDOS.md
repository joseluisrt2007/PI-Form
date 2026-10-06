# Problemas conocidos y correcciones

## Corregidos (versión modular + correcciones)

Estos errores venían del proyecto original y ya están resueltos. Se probaron con Playwright
(ver la sección final).

| # | Problema | Corrección |
|---|---|---|
| 1 | PDF: "Para Idea undefined", sin opciones en Exploración, y Conceptos formados / Mejor concepto vacíos o con "undefined" | `js/pdf/grupos.js` ahora usa `PFM.elementos.getActivos` (ideas y funciones, igual que `morfologia` y `gc1`); `resultados.html` carga `js/shared/elementos.js` |
| 2 | PDF: solo se imprimían 3 tablas de prevención | `sections/prevencion.js` recorre `numeroPrevenciones` (3 solo si falta el dato) |
| 3 | Al borrar una tabla de prevención quedaban datos viejos (`sev3`, `ocu3`) que el PDF imprimía como una prevención fantasma, y se perdían severidad/ocurrencia de la tabla siguiente | `prevenir.js`: eliminar ahora guarda con `saveData()` y `limpiarTablasSobrantes()` borra claves huérfanas |
| 4 | Prevenir: "mejor concepto" leía claves antiguas y casi siempre mostraba "Sin selección" | `generarMejorConcepto` usa `pastel_grupo_<tipo>_<idx>_col<k>` y `PFM.elementos` |
| 5 | `en.js` repetía la clave `criteria_weights` | Se eliminó la línea en español |
| 6 | Resultados: un clic en descargar durante el primer segundo descargaba el PDF dos veces; el nombre del archivo dejaba caracteres inválidos | El clic cancela el temporizador; el nombre conserva tildes y reemplaza solo los caracteres ilegales |
| 7 | Asistente IA (`api/assistant.js`): `context` malformado lanzaba excepción, historial sin límite, `$` en el texto del usuario se interpretaba, `page='constructor'` pasaba la validación | Validación de `context` (400), límites `MAX_MENSAJES` / `MAX_CARACTERES_MENSAJE`, reemplazo con función, `hasOwnProperty` |
| 8 | Necesidades: nunca se avisaba si los pesos no sumaban 10 | Aviso traducido en `#pesoError` (no bloquea el avance) |
| 9 | Diagrama: `MAX_FILAS` no limitaba el alta, HTML del usuario sin escapar, textos "Click para mostrar" fijos en español | Tope real, `escaparHTML` local, claves i18n `click_to_show` / `click_to_show_arrow` |
| 10 | Texto de usuario sin escapar en evaluacion, morfologia, gc1, evalConceptos y prevenir (un `<` o una comilla rompía la página) | Nuevo `js/core/html.js` (`PFM.html.escape`) usado en todas las plantillas |
| 11 | Evaluación y Conceptos formados: Guardar/Continuar dejaban resultados vacíos si se editaba una nota sin pulsar Calcular | `saveData` recalcula los resultados invalidados |
| 12 | Selección de elementos: al vaciar el nombre al editar, el elemento podía guardarse sin nombre | Se restaura el nombre anterior |
| 13 | Textos fijos en español: botón "+ Agregar Prevención", avisos "No hay conceptos/elementos…", confirmación de borrado y error de jsPDF | Claves i18n `add_prevention`, `no_concepts_defined`, `no_elements_to_evaluate`, `confirm_delete_prevention`, `error_jspdf_missing` |
| 14 | CSS sin uso: `.char-counter`, `--completed-*`, `.riesgo-cell[data-risk]` + `@keyframes pulse`, `--warning` | Eliminado |
| 15 | En `resultados.html` un conflicto (`let currentLang` duplicado) impedía cargar `lang.js` | Resuelto al modularizar (el PDF usaba ya la tabla de respaldo) |
| 16 | CSS duplicado en cada página (`.language-selector`, `.theme-toggle`, `.btn-primary/secondary/file-action/calc`, variantes oscuras y responsive) | Movido a `css/base.css`; las páginas solo conservan lo que cambian. Verificado: 0 diferencias de estilo calculado |
| 17 | Reglas `footer` sin elemento en `resultados.css` | Eliminadas |
| 18 | Claves i18n sin uso: 45 en `es.js`/`en.js` y 7 en `pdf.js` | Eliminadas (paridad es/en conservada) |
| 19 | gc1 guardaba el *texto* de la opción elegida (editar la posibilidad desmarcaba la casilla; textos iguales marcaban dos) | Ahora guarda el número de fila en `fila_grupo_<tipo>_<idx>_colK`. `PFM.elementos.migrarSelecciones` convierte los datos antiguos (`pastel_grupo_*`) al abrir gc1, y `getOpcionElegida` también lee el formato antiguo, así que los archivos de proyecto viejos siguen funcionando |
| 20 | Estilos en línea del JS (diagrama y prevenir) tapaban el hover/foco del CSS | Movidos a CSS (`td input[type="text"]`, `.tarea-input`, `.celda-numero`, `.calc-wrap`, `.riesgo-wrap`, `.riesgo-label`, `.riesgo`). Cambios visibles menores en diagrama: hover y foco ahora funcionan, el fondo de los inputs en oscuro es el diseñado (#212c3d) y en móvil rige el padding responsive |
| 21 | Asistente IA solo en español | El widget usa claves `assistant_*` de `i18n/es.js`/`en.js`; el frontend manda `lang` y `api/assistant.js` tiene prompts y errores en `es` y `en` (`SYSTEM_PROMPTS[lang]`, `TEXTOS[lang]`) |

## Pendientes (decisión de diseño o de bajo impacto; no se tocaron)

- **Asistente IA:** solo funciona desplegado en Vercel (`/api/assistant`).
- **Modelo con "thinking":** `MAX_OUTPUT_TOKENS` (1024) también cuenta los tokens de razonamiento en algunos modelos de Gemini; no se pudo verificar sin la API real. Si el asistente devuelve respuestas cortadas o vacías, súbelo. Decisión del responsable del proyecto: se deja en 1024.
- **i18n:** `es.js` tiene valores repetidos con distinta clave (`concept_composition` / `options_forming_concept`; `prevention` / `potential_failure`); cada página los pide por su nombre. Inofensivo.
- Clases sin regla CSS (son solo ganchos de JS, no hay nada que borrar): `.celda-clickable`, `.persona-input`, `.salida-input`, `.no-conceptos-message`.

## Cómo se verificó

Playwright sobre `file://`: recorrido completo de la app comparado con la versión original (capturas,
`localStorage`, PDF, navegación) y 22 pruebas dirigidas, una por corrección. Las únicas
diferencias respecto al original son las correcciones de esta tabla.
