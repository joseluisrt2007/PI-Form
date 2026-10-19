// ============================================================================
// api/assistant.js  ->  Función serverless (Vercel) - Proxy seguro hacia la API
// de Gemini (Google). Es el único archivo del proyecto que corre en servidor
// (Node.js); el resto es JS de navegador.
//
// Se usa Gemini en lugar de Claude porque su capa gratuita es permanente
// (sin tarjeta, sin fecha de expiración) — a diferencia del crédito de
// prueba único de la API de Anthropic. Consulta los límites vigentes en
// https://ai.google.dev antes de publicar el sitio, ya que Google los ajusta
// de vez en cuando.
//
// VARIABLES DE ENTORNO
//   GEMINI_API_KEY  (OBLIGATORIA) clave de la API de Gemini. Se configura ÚNICAMENTE
//                   en el panel de Vercel (Project Settings -> Environment Variables).
//                   Nunca se escribe aquí, nunca se sube al repositorio. Si falta, la
//                   función responde HTTP 500 con un mensaje explicativo.
//   No hay otras variables: modelo, límite de tokens y origen CORS son constantes de abajo.
//
// CONTRATO CON EL FRONTEND (js/features/assistant.js) — NO CAMBIA respecto a la
// versión anterior (el nombre antiguo del frontend era js/asistente.js):
//   POST /api/assistant      (Vercel publica api/assistant.js como /api/assistant)
//   Content-Type: application/json
//   petición: { page: 'necesidades' | 'ideas' | 'evaluacion' | 'descripcion' | 'seleccionEvaluar' | 'diagrama'
//                      | 'morfologia' | 'gc1' | 'evalConceptos' | 'prevenir',
//               lang: 'es' | 'en'   (opcional; idioma del prompt y de los errores; por defecto 'es'),
//               audio: { mimeType, data }   (opcional; grabación en base64 que Gemini escucha como parte
//                                      del ÚLTIMO mensaje del usuario; ver TIPOS_AUDIO y MAX_AUDIO_BASE64),
//               messages: [{ role: 'user' | 'assistant', content: string }, ...],
//               context: {...} }      (forma de context según la página, ver buildSystemPrompt:
//                                      ideas -> { criterios: string[] };
//                                      evaluacion -> { elementos: [{idx, nombre}], criterios: string[] };
//                                      necesidades / descripcion / diagrama -> {};
//                                      seleccionEvaluar / morfologia / gc1 / evalConceptos / prevenir ->
//                                      { lineas: string[] }  (datos reales del proyecto, una línea cada uno) )
//   respuesta OK  (200): { reply: string }   (reply puede ser '' con un campo `error`
//                        opcional si Gemini no devolvió texto)
//   respuesta error:     { error: string } con HTTP 400 (página o historial inválidos),
//                        405 (método distinto de POST/OPTIONS), 500 (sin API key o error
//                        inesperado) o el mismo código que devolvió Gemini.
//   OPTIONS: responde 204 (preflight CORS).
//
// PROMPT DEL SISTEMA: hay uno por página e idioma (SYSTEM_PROMPTS[lang][page]). Le indica al modelo que
// converse (en español o inglés según `lang`) de forma breve y que, cuando termine de ayudar al usuario,
// incluya en su respuesta un bloque:
//   [ARCHIVO_TXT]
//   ...contenido exacto del .txt...
//   [/ARCHIVO_TXT]
// que el frontend extrae y pasa a PFM.page.importText (la función aplicarContenidoTXT
// que cada página registra: necesidades.js / ideas.js / evaluacion.js).
// El formato del .txt (cabecera NECESIDADES_PRIORIDADES_V1 / IDEAS_CONCEPTOS_V1 /
// EVALUACION_IDEAS_V1; y para las demás páginas DESCRIPCION_V1, SELECCION_EVALUAR_V1, DIAGRAMA_V1,
// MORFOLOGIA_V1, GC1_V1, EVAL_CONCEPTOS_V1 y PREVENIR_V1; campos separados por TABULADOR) debe
// coincidir con lo que leen esas páginas con PFM.fileIO.contentLines / splitFields.
//
// Robustez: el historial se recorta (MAX_MENSAJES / MAX_CARACTERES_MENSAJE), `context` se valida
// (solo se aceptan listas de textos) y un context malformado devuelve HTTP 400 en lugar de
// una excepción no capturada.
// ============================================================================

// Modelo de Gemini. gemini-2.5-flash dejó de estar disponible para cuentas nuevas (la API responde
// "This model models/gemini-2.5-flash is no longer available to new users"), por eso se usa
// gemini-3.8-flash. Si Google lo retira, la API devuelve un error parecido: basta cambiar MODEL.
// Puedes cambiarlo por otro modelo gratuito listado en https://ai.google.dev/gemini-api/docs/models
// CONFIGURABLE: modelo de Gemini. Se interpola en GEMINI_API_URL, así que basta cambiar esta línea.
// Cada modelo tiene sus propios límites de la capa gratuita; si el nombre no existe la API
// responde error y el widget muestra el mensaje de Gemini. No hay otro archivo que cambiar.
const MODEL = 'gemini-3.8-flash';
// Endpoint REST v1beta de generación de contenido (sin streaming). La API key NO va en la URL
// sino en la cabecera x-goog-api-key (ver el fetch más abajo).
const urlDeModelo = modelo => `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`;

// CONFIGURABLE: modelos de respaldo, en orden. Si MODEL está saturado (HTTP 503 "high demand"),
// no existe para la cuenta o agotó su cuota (HTTP 429), el servidor prueba el siguiente.
// gemini-3.5-flash-lite es el más económico de la lista de Google. Dejar [] para no usar respaldo.
const MODELOS_RESPALDO = ['gemini-3.5-flash-lite'];

// CONFIGURABLE: reintentos sobre el MISMO modelo ante errores temporales (503/500/504) y espera
// entre ellos. Con 1 reintento y 1000 ms se tolera un pico breve sin acercarse al límite de tiempo
// de la función de Vercel.
const REINTENTOS_POR_MODELO = 1;
const ESPERA_REINTENTO_MS = 1000;

const dormir = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Llama a Gemini con reintentos y modelos de respaldo.
 * @param {Object} cuerpo  Cuerpo de la petición (system_instruction, contents, generationConfig).
 * @returns {Promise<{apiResponse:Response, data:Object}>} La primera respuesta buena, o la última
 *   respuesta de error si todos los intentos fallan.
 * Orden: MODEL y luego cada modelo de MODELOS_RESPALDO. 503/500/504 -> se reintenta el mismo modelo
 * y luego se pasa al siguiente; 429 y 404 (modelo no disponible) -> se pasa al siguiente enseguida;
 * cualquier otro error (400, 401, 403...) se devuelve sin más intentos, porque otro modelo no lo arregla.
 */
async function llamarGemini(cuerpo) {
  let ultima = null;
  for (const modelo of [MODEL, ...MODELOS_RESPALDO]) {
    for (let intento = 0; intento <= REINTENTOS_POR_MODELO; intento++) {
      const apiResponse = await fetch(urlDeModelo(modelo), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY
        },
        body: JSON.stringify(cuerpo)
      });
      // Se lee el JSON incluso en error: Gemini explica el fallo en data.error.message.
      // CUIDADO: si la respuesta no fuera JSON, .json() lanza y cae en el catch del handler (HTTP 500 genérico).
      const data = await apiResponse.json();
      ultima = { apiResponse, data };
      if (apiResponse.ok) return ultima;

      const estado = apiResponse.status;
      console.error(`Gemini (${modelo}) respondió ${estado}:`, data);
      if (estado === 429 || estado === 404) break; // otro modelo
      if (estado !== 503 && estado !== 500 && estado !== 504) return ultima; // error no temporal
      if (intento < REINTENTOS_POR_MODELO) await dormir(ESPERA_REINTENTO_MS);
    }
  }
  return ultima;
}
// CONFIGURABLE: tope de tokens de la respuesta del modelo (generationConfig.maxOutputTokens).
// 1024 alcanza para una charla breve y el bloque [ARCHIVO_TXT]; la evaluación completa
// (hasta 5 ideas x 5 criterios = 25 líneas) cabe, pero si se aumentan ideas/criterios hay
// que subirlo o la respuesta se corta y el bloque no llega a cerrarse (el frontend no
// detectaría el archivo). Ojo: en modelos con "thinking" esos tokens también se consumen
// pensando (no verificado para este modelo). Sin otro archivo que tocar.
const MAX_OUTPUT_TOKENS = 1024;

// CONFIGURABLE: nº máximo de mensajes del historial que se envían a Gemini (los más recientes).
// Evita peticiones enormes y costos/latencia crecientes en charlas largas. Con 40 caben ~20
// intercambios; si se recorta, el modelo "olvida" lo más antiguo de la conversación.
const MAX_MENSAJES = 40;

// CONFIGURABLE: nº máximo de caracteres por mensaje (el resto se corta). Protege de cuerpos
// gigantes; 4000 caracteres sobran para un mensaje normal del usuario.
const MAX_CARACTERES_MENSAJE = 4000;

// CONFIGURABLE: tipos MIME de audio que se aceptan (los que Gemini entiende: WAV, MP3, AIFF, AAC, OGG,
// FLAC). Cualquier otro se rechaza con HTTP 400. Debe ser compatible con AUDIO_POR_EXTENSION de
// js/features/assistant.js.
const TIPOS_AUDIO = ['audio/wav', 'audio/mpeg', 'audio/aiff', 'audio/aac', 'audio/ogg', 'audio/flac'];

// CONFIGURABLE: tamaño máximo del audio en base64 (caracteres). Vercel limita el cuerpo de la petición
// a ~4.5 MB (incluye el historial), así que 4.1 millones deja margen; equivale a ~3 MB de audio
// (MAX_AUDIO_BYTES en js/features/assistant.js). Subirlo exige otra vía de subida.
const MAX_AUDIO_BASE64 = 4100000;

// CONFIGURABLE: nº máximo de ideas/criterios aceptados en `context` (el proyecto tiene 5 de cada uno).
const MAX_ELEMENTOS_CONTEXTO = 10;
// CONFIGURABLE: nº máximo de líneas de `context.lineas` (ver listaDeLineas) y de caracteres por línea (400).
const MAX_LINEAS_CONTEXTO = 40;

// Cambia esto por tu dominio (p. ej. 'https://tuusuario.github.io') si quieres
// restringir quién puede llamar a esta función. '*' permite cualquier origen.
// CONFIGURABLE: valor de Access-Control-Allow-Origin. Con '*' cualquier sitio puede usar
// tu cuota de Gemini desde su navegador; en producción pon tu dominio exacto.
// CUIDADO: el frontend llama a '/api/assistant' en el mismo origen, así que CORS solo importa
// si se aloja la web en otro dominio distinto del de Vercel (p. ej. GitHub Pages).
const ALLOWED_ORIGIN = '*';

// Prompts del sistema, uno por página (clave = valor de data-page del frontend).
// Los marcadores {contextoCriterios} y {contextoElementos} son texto literal que
// buildSystemPrompt reemplaza con datos reales del proyecto. Los \t dentro de las plantillas
// son tabuladores reales al evaluarse el template literal (el .txt usa tabuladores).
// CONFIGURABLE: "3 a 5" necesidades/ideas, "pesos suman 10" y "criterio del 1 al 5" reflejan
// los límites del proyecto (PFM.scoring.NUM_CRITERIOS, PFM.elementos.MAX_IDEAS y la suma 10
// de pesos que asume js/pages/necesidades.js; ahí solo se documenta, no se valida por código). Si se cambian allí hay que reescribirlos aquí.
// CUIDADO: las marcas [ARCHIVO_TXT] / [/ARCHIVO_TXT] y las cabeceras V1 deben coincidir con
// la regex de extraerArchivo (js/features/assistant.js) y con los parsers de las páginas.
// Para soportar una página nueva con asistente, añade aquí su entrada.
const SYSTEM_PROMPTS_ES = {
  necesidades: `Eres un asistente que ayuda a un usuario a identificar las
NECESIDADES y PRIORIDADES de un proyecto de mejora (metodología de
Actividades de Mejora). Conversa de forma breve y natural en español,
haciendo preguntas concretas (máximo una por turno) para ayudarlo a
pensar en 3 a 5 necesidades reales de su proyecto y asignarles un peso
de prioridad. Los pesos son números y, en conjunto, deben sumar 10
(por ejemplo: 3, 2, 2, 2, 1).

Cuando ya tengas entre 3 y 5 necesidades claras con su peso, o el
usuario te pida generar el archivo, responde con un mensaje breve de
confirmación seguido EXACTAMENTE de este bloque (usa tabulador real
entre columnas, no espacios, no uses comas):

[ARCHIVO_TXT]
NECESIDADES_PRIORIDADES_V1
1\t<necesidad 1>\t<peso 1>
2\t<necesidad 2>\t<peso 2>
3\t<necesidad 3>\t<peso 3>
[/ARCHIVO_TXT]

Incluye solo las filas ya definidas (mínimo 3, máximo 5, numeradas
desde 1). No agregues explicaciones ni texto extra dentro del bloque
[ARCHIVO_TXT]...[/ARCHIVO_TXT].`,

  ideas: `Eres un asistente que ayuda a un usuario a generar IDEAS o
CONCEPTOS de solución para su proyecto de mejora. Conversa en español
de forma breve, hazle preguntas para entender el problema y ayúdalo a
proponer entre 3 y 5 ideas concretas.
{contextoCriterios}

Cuando tengas entre 3 y 5 ideas claras, o el usuario te pida generar
el archivo, responde con un mensaje breve seguido EXACTAMENTE de:

[ARCHIVO_TXT]
IDEAS_CONCEPTOS_V1
1\t<idea 1>
2\t<idea 2>
3\t<idea 3>
[/ARCHIVO_TXT]

Incluye solo las filas ya definidas (mínimo 3, máximo 5, numeradas
desde 1). No agregues explicaciones ni texto extra dentro del bloque
[ARCHIVO_TXT]...[/ARCHIVO_TXT].`,

  evaluacion: `Eres un asistente que ayuda a un usuario a EVALUAR, del 0
al 10, un conjunto de ideas ya definidas frente a una lista de
criterios ya definidos. Estos son los datos reales del proyecto del
usuario; no los inventes ni los cambies:

{contextoElementos}

Conversa en español de forma breve, pregunta su opinión sobre cada
idea frente a cada criterio (puedes agrupar preguntas si el usuario
prefiere ir rápido) y ayúdalo a asignar una calificación de 0 a 10 a
cada combinación idea-criterio.

Cuando tengas todas las calificaciones, o el usuario te pida generar
el archivo, responde con un mensaje breve seguido EXACTAMENTE de:

[ARCHIVO_TXT]
EVALUACION_IDEAS_V1
concepto\t<idx>\t<criterio del 1 al 5>\t<calificación 0-10>
[/ARCHIVO_TXT]

Genera una línea por cada combinación idea-criterio, usando el idx
real de cada idea indicado arriba. No agregues explicaciones ni texto
extra dentro del bloque [ARCHIVO_TXT]...[/ARCHIVO_TXT].`
};

const SYSTEM_PROMPTS_EN = {
  necesidades: `You are an assistant that helps a user identify the
NEEDS and PRIORITIES of an improvement project (Improvement Activities
methodology). Converse briefly and naturally in English, asking concrete
questions (at most one per turn) to help them think of 3 to 5 real needs
of their project and assign each a priority weight. The weights are
numbers and, together, must add up to 10 (for example: 3, 2, 2, 2, 1).

Once you have between 3 and 5 clear needs with their weight, or the user
asks you to generate the file, reply with a short confirmation message
followed EXACTLY by this block (use a real tab between columns, not
spaces, and do not use commas):

[ARCHIVO_TXT]
NECESIDADES_PRIORIDADES_V1
1\t<need 1>\t<weight 1>
2\t<need 2>\t<weight 2>
3\t<need 3>\t<weight 3>
[/ARCHIVO_TXT]

Include only the rows already defined (minimum 3, maximum 5, numbered
from 1). Do not add explanations or extra text inside the
[ARCHIVO_TXT]...[/ARCHIVO_TXT] block.`,

  ideas: `You are an assistant that helps a user generate IDEAS or solution
CONCEPTS for their improvement project. Converse briefly in English, ask
questions to understand the problem and help them come up with between 3
and 5 concrete ideas.
{contextoCriterios}

Once you have between 3 and 5 clear ideas, or the user asks you to
generate the file, reply with a short message followed EXACTLY by:

[ARCHIVO_TXT]
IDEAS_CONCEPTOS_V1
1\t<idea 1>
2\t<idea 2>
3\t<idea 3>
[/ARCHIVO_TXT]

Include only the rows already defined (minimum 3, maximum 5, numbered
from 1). Do not add explanations or extra text inside the
[ARCHIVO_TXT]...[/ARCHIVO_TXT] block.`,

  evaluacion: `You are an assistant that helps a user EVALUATE, from 0 to
10, a set of already defined ideas against a list of already defined
criteria. These are the user's real project data; do not invent or
change them:

{contextoElementos}

Converse briefly in English, ask for their opinion on each idea against
each criterion (you may group questions if the user prefers to go fast)
and help them assign a score from 0 to 10 to every idea-criterion
combination.

Once you have all the scores, or the user asks you to generate the file,
reply with a short message followed EXACTLY by:

[ARCHIVO_TXT]
EVALUACION_IDEAS_V1
concepto\t<idx>\t<criterion from 1 to 5>\t<score 0-10>
[/ARCHIVO_TXT]

Write one line for every idea-criterion combination, using the real idx
of each idea given above. Do not add explanations or extra text inside
the [ARCHIVO_TXT]...[/ARCHIVO_TXT] block.`
};

// ---------------------------------------------------------------------------
// Prompts de las páginas de captura restantes (descripcion, seleccionEvaluar, diagrama, morfologia,
// gc1, evalConceptos, prevenir). Idea de diseño: el usuario puede contar TODO su negocio (por voz,
// audio o texto) en cualquier página, pero cada prompt le dice al modelo que SOLO extraiga lo que esa
// página pide e ignore el resto. {contextoGeneral} se sustituye por `context.lineas` (datos reales del
// proyecto que arma js/features/assistant.js). Los \t son tabuladores reales. Las cabeceras (V1) deben
// coincidir con las que lee el aplicarContenidoTXT de cada js/pages/<página>.js.
// ---------------------------------------------------------------------------
const REGLAS_COMUNES_ES = `

REGLAS IMPORTANTES:
- Esta página SOLO captura lo descrito arriba. Si el usuario (por texto, dictado o audio) cuenta además
  otras cosas de su negocio que no pertenecen a esta página, IGNÓRALAS: no las incluyas en el archivo y
  no las comentes, salvo una frase breve diciendo que quedan para la página que corresponda.
- No inventes datos. Si el usuario no dijo algo, déjalo fuera (o vacío) en lugar de suponerlo.
- Si ya hay información suficiente (sobre todo si viene en un audio), genera el bloque de inmediato.
  Pregunta solo por lo imprescindible que falte (máximo una pregunta por turno).
- Los números pueden venir con letras ("tres", "siete punto cinco"); escríbelos con cifras.
- Dentro del bloque [ARCHIVO_TXT]: tabuladores reales entre columnas, sin explicaciones ni texto extra.`;

const REGLAS_COMUNES_EN = `

IMPORTANT RULES:
- This page ONLY captures what is described above. If the user (by text, dictation or audio) also talks
  about other aspects of their business that do not belong to this page, IGNORE them: do not include them in
  the file and do not comment on them, except for one short sentence saying they are for the matching page.
- Do not invent data. If the user did not say something, leave it out (or empty) instead of assuming it.
- If there is already enough information (especially if it comes in an audio), generate the block right away.
  Ask only about what is essential and missing (at most one question per turn).
- Numbers may be spelled out ("three", "seven point five"); write them as digits.
- Inside the [ARCHIVO_TXT] block: real tab characters between columns, no explanations or extra text.`;

const PROMPTS_PAGINAS_ES = {
  descripcion: `Eres un asistente que ayuda a completar la página "Descripción del proyecto" de una herramienta
de mejora de negocios. Conversa en español de forma breve. Esa página SOLO pide:
1. NOMBRE del proyecto (corto, máximo 60 caracteres).
2. DESCRIPCIÓN del proyecto o del negocio: qué hace y qué se quiere mejorar. Redáctala en limpio, en una sola
   línea (2 a 5 frases), usando solo lo que el usuario contó.
3. MÓDULOS opcionales que quiere usar: definicionIdeas (definición de ideas), diagrama (diagrama de proceso),
   exploracionConceptos (exploración de conceptos), prevencion (prevención de fallas). Solo inclúyelos si el
   usuario habla explícitamente de usarlos o no usarlos.

Cuando tengas al menos el nombre o la descripción, responde con un mensaje breve seguido EXACTAMENTE de:

[ARCHIVO_TXT]
DESCRIPCION_V1
nombre\t<nombre>
descripcion\t<descripción>
modulo\t<definicionIdeas|diagrama|exploracionConceptos|prevencion>\t<si|no>
[/ARCHIVO_TXT]

Incluye solo las líneas que el usuario aportó (las líneas modulo son opcionales y puede haber varias).${REGLAS_COMUNES_ES}`,

  seleccionEvaluar: `Eres un asistente que ayuda en la página "Selección de elementos a evaluar": el usuario marca cuáles de
sus ideas (concepto) y tareas quiere evaluar después. Conversa en español de forma breve. Esa página SOLO pide
esa selección. Estos son los elementos reales disponibles; no los inventes:

{contextoGeneral}

Cuando sepas cuáles quiere evaluar, responde con un mensaje breve seguido EXACTAMENTE de:

[ARCHIVO_TXT]
SELECCION_EVALUAR_V1
elemento\t<concepto|tarea>\t<idx>
[/ARCHIVO_TXT]

Una línea por cada elemento a evaluar, con el tipo y el idx exactos de la lista. Los elementos que no pongas
quedarán sin marcar.${REGLAS_COMUNES_ES}`,

  diagrama: `Eres un asistente que ayuda en la página "Diagrama de proceso". Conversa en español de forma breve. Esa página
SOLO pide, por cada PASO del proceso del negocio y en orden: quién es el RESPONSABLE (persona o área), cuál es
la TAREA y cuál es la SALIDA (lo que produce o entrega ese paso). Cada texto debe ser corto: máximo 30
caracteres (resume o abrevia sin perder el sentido). Máximo 50 pasos.

Cuando tengas el proceso, responde con un mensaje breve seguido EXACTAMENTE de:

[ARCHIVO_TXT]
DIAGRAMA_V1
fila\t<responsable>\t<tarea>\t<salida>
[/ARCHIVO_TXT]

Una línea por paso, en orden. Si no se mencionó el responsable o la salida de un paso, deja ese campo vacío.
Este archivo REEMPLAZA el diagrama actual.${REGLAS_COMUNES_ES}`,

  morfologia: `Eres un asistente que ayuda en la página "Exploración de posibilidades". Conversa en español de forma breve.
Esa página SOLO pide, para cada elemento (idea o tarea) de la lista, hasta 3 POSIBILIDADES: formas distintas de
resolverlo o de hacerlo (frases cortas, máximo 80 caracteres). Estos son los elementos reales; no los
inventes:

{contextoGeneral}

Cuando tengas posibilidades, responde con un mensaje breve seguido EXACTAMENTE de:

[ARCHIVO_TXT]
MORFOLOGIA_V1
posibilidad\t<tipo>\t<idx>\t<número 1 a 3>\t<posibilidad>
[/ARCHIVO_TXT]

Una línea por posibilidad, con el tipo e idx exactos del elemento. Solo elementos de la lista.${REGLAS_COMUNES_ES}`,

  gc1: `Eres un asistente que ayuda en la página "Formación de conceptos". Conversa en español de forma breve. Cada
CONCEPTO FORMADO (1, 2 o 3) es una combinación: para cada elemento se elige UNA de sus opciones (1 a 3). Esa
página SOLO pide qué opción elige el usuario para cada elemento en cada concepto formado. Estos son los
elementos y sus opciones reales; no los inventes:

{contextoGeneral}

Cuando tengas las combinaciones, responde con un mensaje breve seguido EXACTAMENTE de:

[ARCHIVO_TXT]
GC1_V1
seleccion\t<tipo>\t<idx>\t<concepto formado 1 a 3>\t<opción 1 a 3>
[/ARCHIVO_TXT]

Una línea por elemento y concepto formado. Solo opciones que existan en la lista. Si el usuario describe una
combinación con palabras (no con números), empareja con la opción cuyo texto corresponda.${REGLAS_COMUNES_ES}`,

  evalConceptos: `Eres un asistente que ayuda en la página "Evaluación de conceptos formados". Conversa en español de forma
breve. Esa página SOLO pide una CALIFICACIÓN de 0 a 10 (se admite un decimal) para cada concepto formado
(1 a 3) frente a cada criterio. Estos son los datos reales del proyecto; no los inventes:

{contextoGeneral}

Cuando tengas calificaciones, responde con un mensaje breve seguido EXACTAMENTE de:

[ARCHIVO_TXT]
EVAL_CONCEPTOS_V1
calificacion\t<concepto formado 1 a 3>\t<criterio 1 a 5>\t<0-10>
[/ARCHIVO_TXT]

Una línea por calificación que el usuario haya dado o que se pueda deducir claramente de lo que dijo.${REGLAS_COMUNES_ES}`,

  prevenir: `Eres un asistente que ayuda en la página "Prevención de fallas" (análisis de riesgo). Conversa en español de
forma breve. Cada TABLA de prevención pide: FALLA potencial, EFECTO de esa falla, SEVERIDAD (1 a 10),
OCURRENCIA (1 a 10), ACCIONES a tomar, RESPONSABLE, ACCIÓN tomada (si ya se hizo algo) y FECHA de la acción
(AAAA-MM-DD). El riesgo se calcula solo (severidad x ocurrencia). Datos reales del proyecto:

{contextoGeneral}

Cuando tengas fallas, responde con un mensaje breve seguido EXACTAMENTE de:

[ARCHIVO_TXT]
PREVENIR_V1
prevencion\t<n>\t<falla>\t<efecto>\t<severidad>\t<ocurrencia>\t<acciones a tomar>\t<responsable>\t<acción tomada>\t<fecha>
[/ARCHIVO_TXT]

Una línea por falla, numeradas con n. Si ya hay tablas con contenido (ver datos), numera las nuevas a partir de la
siguiente para no pisarlas. Los campos que el usuario no mencionó se dejan vacíos (puede haber tabuladores
seguidos). Convierte fechas dichas con palabras a AAAA-MM-DD usando la fecha de hoy indicada.${REGLAS_COMUNES_ES}`
};

const PROMPTS_PAGINAS_EN = {
  descripcion: `You are an assistant that helps fill in the "Project description" page of a business improvement tool.
Converse briefly in English. That page ONLY asks for:
1. The project NAME (short, at most 60 characters).
2. The project or business DESCRIPTION: what it does and what should be improved. Write it cleanly, on a single
   line (2 to 5 sentences), using only what the user said.
3. Optional MODULES they want to use: definicionIdeas (idea definition), diagrama (process diagram),
   exploracionConceptos (concept exploration), prevencion (failure prevention). Include them only if the user
   explicitly talks about using or not using them.

When you have at least the name or the description, reply with a short message followed EXACTLY by:

[ARCHIVO_TXT]
DESCRIPCION_V1
nombre\t<name>
descripcion\t<description>
modulo\t<definicionIdeas|diagrama|exploracionConceptos|prevencion>\t<si|no>
[/ARCHIVO_TXT]

Include only the lines the user provided (modulo lines are optional and there can be several). Keep the literal
words nombre, descripcion, modulo, si and no in the file.${REGLAS_COMUNES_EN}`,

  seleccionEvaluar: `You are an assistant that helps on the "Select items to evaluate" page: the user ticks which of their ideas
(concepto) and tasks (tarea) they want to evaluate later. Converse briefly in English. That page ONLY asks for that
selection. These are the real items available; do not invent any:

{contextoGeneral}

When you know which ones they want to evaluate, reply with a short message followed EXACTLY by:

[ARCHIVO_TXT]
SELECCION_EVALUAR_V1
elemento\t<concepto|tarea>\t<idx>
[/ARCHIVO_TXT]

One line per item to evaluate, with the exact type and idx from the list. Items you leave out will be unticked.${REGLAS_COMUNES_EN}`,

  diagrama: `You are an assistant that helps on the "Process diagram" page. Converse briefly in English. That page ONLY asks,
for each STEP of the business process and in order: who is RESPONSIBLE (person or area), what the TASK is and
what the OUTPUT is (what that step produces or hands over). Each text must be short: at most 30 characters
(summarize or abbreviate without losing meaning). At most 50 steps.

When you have the process, reply with a short message followed EXACTLY by:

[ARCHIVO_TXT]
DIAGRAMA_V1
fila\t<responsible>\t<task>\t<output>
[/ARCHIVO_TXT]

One line per step, in order. If the responsible or the output of a step was not mentioned, leave that field empty.
This file REPLACES the current diagram. Keep the literal word fila.${REGLAS_COMUNES_EN}`,

  morfologia: `You are an assistant that helps on the "Explore possibilities" page. Converse briefly in English. That page ONLY
asks, for each item (idea or task) in the list, up to 3 POSSIBILITIES: different ways to solve or do it (short
phrases, at most 80 characters). These are the real items; do not invent any:

{contextoGeneral}

When you have possibilities, reply with a short message followed EXACTLY by:

[ARCHIVO_TXT]
MORFOLOGIA_V1
posibilidad\t<type>\t<idx>\t<number 1 to 3>\t<possibility>
[/ARCHIVO_TXT]

One line per possibility, with the exact type and idx of the item. Only items from the list. Keep the literal word
posibilidad.${REGLAS_COMUNES_EN}`,

  gc1: `You are an assistant that helps on the "Concept formation" page. Converse briefly in English. Each FORMED CONCEPT
(1, 2 or 3) is a combination: for each item ONE of its options (1 to 3) is chosen. That page ONLY asks which option
the user picks for each item in each formed concept. These are the real items and their options; do not invent
any:

{contextoGeneral}

When you have the combinations, reply with a short message followed EXACTLY by:

[ARCHIVO_TXT]
GC1_V1
seleccion\t<type>\t<idx>\t<formed concept 1 to 3>\t<option 1 to 3>
[/ARCHIVO_TXT]

One line per item and formed concept. Only options that exist in the list. If the user describes a combination in
words (not numbers), match it with the option whose text fits. Keep the literal word seleccion.${REGLAS_COMUNES_EN}`,

  evalConceptos: `You are an assistant that helps on the "Evaluate formed concepts" page. Converse briefly in English. That page
ONLY asks for a RATING from 0 to 10 (one decimal allowed) for each formed concept (1 to 3) against each criterion.
These are the real project data; do not invent any:

{contextoGeneral}

When you have ratings, reply with a short message followed EXACTLY by:

[ARCHIVO_TXT]
EVAL_CONCEPTOS_V1
calificacion\t<formed concept 1 to 3>\t<criterion 1 to 5>\t<0-10>
[/ARCHIVO_TXT]

One line per rating the user gave or that can be clearly deduced from what they said. Keep the literal word
calificacion.${REGLAS_COMUNES_EN}`,

  prevenir: `You are an assistant that helps on the "Failure prevention" page (risk analysis). Converse briefly in English.
Each prevention TABLE asks for: potential FAILURE, its EFFECT, SEVERITY (1 to 10), OCCURRENCE (1 to 10), ACTIONS to
take, RESPONSIBLE person, ACTION taken (if something was already done) and the action DATE (YYYY-MM-DD). The risk is
computed automatically (severity x occurrence). Real project data:

{contextoGeneral}

When you have failures, reply with a short message followed EXACTLY by:

[ARCHIVO_TXT]
PREVENIR_V1
prevencion\t<n>\t<failure>\t<effect>\t<severity>\t<occurrence>\t<actions to take>\t<responsible>\t<action taken>\t<date>
[/ARCHIVO_TXT]

One line per failure, numbered with n. If tables with content already exist (see data), number the new ones from the
next number so they are not overwritten. Fields the user did not mention stay empty (consecutive tabs are fine).
Convert dates said in words to YYYY-MM-DD using today's date given above. Keep the literal word prevencion.${REGLAS_COMUNES_EN}`
};

Object.assign(SYSTEM_PROMPTS_ES, PROMPTS_PAGINAS_ES);
Object.assign(SYSTEM_PROMPTS_EN, PROMPTS_PAGINAS_EN);

// Textos sueltos que buildSystemPrompt y el handler insertan, por idioma.
// CONFIGURABLE: al agregar un idioma, añadir aquí su entrada (y su prompt en SYSTEM_PROMPTS).
const TEXTOS = {
  es: {
    criteriosIdeas: lista => `Los criterios que el usuario ya definió para evaluar después estas ideas son: ${lista}. Úsalos como referencia para sugerir ideas relevantes.`,
    sinIdeas: '(el usuario todavía no tiene ideas registradas; dile que regrese a la página de Ideas primero)',
    sinCriterios: '(no hay criterios registrados)',
    sinContexto: '(no hay datos registrados todavía en las páginas anteriores)',
    bloqueContexto: lineas => lineas.join('\n'),
    bloqueEvaluacion: (elementos, criterios) => `IDEAS A EVALUAR:\n${elementos}\n\nCRITERIOS (numerados del 1 al 5):\n${criterios}`,
    notaVoz: 'Nota: el usuario puede escribir sus mensajes dictándolos por voz, así que pueden venir sin puntuación, con mayúsculas irregulares o con alguna palabra mal reconocida. Interpreta la intención con tolerancia y, si algo es ambiguo, pregúntalo. Los números pueden venir escritos con letras ("tres", "siete punto cinco"); conviértelos a cifras en el archivo.',
    notaAudio: 'Nota: el último mensaje del usuario incluye una grabación de audio. Escúchala completa y trata lo que se dice en ella como lo que el usuario te cuenta (lo que corresponda a esta página: necesidades, ideas, calificaciones, el proceso, etc.). No transcribas el audio completo en tu respuesta: usa su contenido para ayudarlo y haz preguntas solo sobre lo que falte o esté poco claro.',
    errAudio: 'El audio no es válido o es demasiado grande.',
    errMetodo: 'Método no permitido',
    errSinClave: 'El servidor no tiene configurada la variable GEMINI_API_KEY.',
    errContexto: 'Contexto inválido.',
    errPagina: 'Página no reconocida.',
    errHistorial: 'Falta el historial de mensajes.',
    errGemini: 'Error al contactar al asistente.',
    errSinRespuesta: motivo => `El asistente no generó respuesta (motivo: ${motivo}). Intenta reformular tu mensaje.`,
    errInesperado: 'Error inesperado del servidor.'
  },
  en: {
    criteriosIdeas: lista => `The criteria the user has already defined to evaluate these ideas later are: ${lista}. Use them as a reference to suggest relevant ideas.`,
    sinIdeas: '(the user has no ideas yet; tell them to go back to the Ideas page first)',
    sinCriterios: '(no criteria registered)',
    sinContexto: '(no data registered yet in the previous pages)',
    bloqueContexto: lineas => lineas.join('\n'),
    bloqueEvaluacion: (elementos, criterios) => `IDEAS TO EVALUATE:\n${elementos}\n\nCRITERIA (numbered 1 to 5):\n${criterios}`,
    notaVoz: 'Note: the user may type messages by voice dictation, so they may lack punctuation, have irregular capitalization or contain a misrecognized word. Interpret the intent tolerantly and, if something is ambiguous, ask. Numbers may be spelled out ("three", "seven point five"); convert them to digits in the file.',
    notaAudio: 'Note: the user\'s last message includes an audio recording. Listen to all of it and treat what is said in it as what the user is telling you (whatever belongs to this page: needs, ideas, scores, the process, etc.). Do not transcribe the whole audio in your reply: use its content to help them and ask only about what is missing or unclear.',
    errAudio: 'The audio is invalid or too large.',
    errMetodo: 'Method not allowed',
    errSinClave: 'The server does not have the GEMINI_API_KEY variable configured.',
    errContexto: 'Invalid context.',
    errPagina: 'Page not recognized.',
    errHistorial: 'The message history is missing.',
    errGemini: 'Error contacting the assistant.',
    errSinRespuesta: motivo => `The assistant did not generate a response (reason: ${motivo}). Try rephrasing your message.`,
    errInesperado: 'Unexpected server error.'
  }
};

// Prompts por idioma: SYSTEM_PROMPTS[lang][page]. El frontend manda `lang` ('es' | 'en');
// cualquier otro valor o su ausencia usa 'es'.
const SYSTEM_PROMPTS = { es: SYSTEM_PROMPTS_ES, en: SYSTEM_PROMPTS_EN };
const IDIOMA_POR_DEFECTO = 'es';

/** Idioma válido para el prompt y los mensajes ('es' | 'en'); cualquier otro valor -> 'es'. */
function normalizarIdioma(lang) {
  return typeof lang === 'string' && Object.prototype.hasOwnProperty.call(SYSTEM_PROMPTS, lang) ? lang : IDIOMA_POR_DEFECTO;
}

/**
 * Convierte un valor del `context` en una lista de textos segura: si no es un array devuelve [],
 * y limita la cantidad (MAX_ELEMENTOS_CONTEXTO) y la longitud de cada texto (200 caracteres).
 * @param {*} valor  Lo que mandó el frontend (se asume array de textos, pero no se confía en ello).
 * @returns {string[]}
 */
function listaDeTextos(valor) {
  if (!Array.isArray(valor)) return [];
  return valor.slice(0, MAX_ELEMENTOS_CONTEXTO).map(v => String(v == null ? '' : v).slice(0, 200));
}

/**
 * Convierte `context.lineas` (datos reales del proyecto, una cadena por línea) en una lista segura:
 * máximo MAX_LINEAS_CONTEXTO líneas de 400 caracteres. Lo usan las páginas de captura que no tienen
 * un contexto propio (descripcion, seleccionEvaluar, diagrama, morfologia, gc1, evalConceptos, prevenir).
 * @param {*} valor  Lo que mandó el frontend (se asume array de textos, pero no se confía en ello).
 * @returns {string[]}
 */
function listaDeLineas(valor) {
  if (!Array.isArray(valor)) return [];
  return valor.slice(0, MAX_LINEAS_CONTEXTO).map(v => String(v == null ? '' : v).slice(0, 400)).filter(v => v.trim());
}

/**
 * Construye el prompt del sistema de la página, insertando los datos del proyecto.
 * @param {string} page      'necesidades' | 'ideas' | 'evaluacion' (clave de SYSTEM_PROMPTS[lang]).
 * @param {string} [lang]    'es' | 'en' (por defecto 'es').
 * @param {Object} [context] Datos enviados por el frontend (ver contrato en la cabecera).
 * @returns {string|null} Prompt listo, o null si `page` no está en SYSTEM_PROMPTS
 *   (el handler lo convierte en HTTP 400 'Página no reconocida.').
 */
function buildSystemPrompt(page, context, lang) {
  const idioma = normalizarIdioma(lang);
  const prompts = SYSTEM_PROMPTS[idioma];
  const tx = TEXTOS[idioma];
  // hasOwnProperty: evita que page = 'constructor' o '__proto__' devuelva algo heredado del objeto.
  if (typeof page !== 'string' || !Object.prototype.hasOwnProperty.call(prompts, page)) return null;
  const base = prompts[page];

  // ideas: sustituye {contextoCriterios} por la lista de criterios (o por '' si no hay).
  if (page === 'ideas') {
    const criterios = listaDeTextos(context && context.criterios);
    const texto = criterios.length
      ? tx.criteriosIdeas(criterios.join(', '))
      : '';
    // Función de reemplazo: así un "$&" o "$1" en el texto del usuario se inserta literalmente.
    return base.replace('{contextoCriterios}', () => texto);
  }

  // evaluacion: sustituye {contextoElementos} por las ideas (con su idx real) y los criterios
  // numerados desde 1. El idx es el que el modelo debe devolver en las líneas 'concepto\t<idx>...'.
  if (page === 'evaluacion') {
    const elementos = Array.isArray(context && context.elementos)
      ? context.elementos.slice(0, MAX_ELEMENTOS_CONTEXTO).filter(e => e && typeof e === 'object')
      : [];
    const criterios = listaDeTextos(context && context.criterios);
    const listaElementos = elementos.length
      ? elementos.map(e => `- idx ${parseInt(e.idx, 10) || 0}: "${String(e.nombre == null ? '' : e.nombre).slice(0, 200)}"`).join('\n')
      : tx.sinIdeas;
    const listaCriterios = criterios.length
      ? criterios.map((c, i) => `${i + 1}. ${c}`).join('\n')
      : tx.sinCriterios;
    // Función de reemplazo (ver nota en 'ideas'): los "$" del usuario no se interpretan.
    const bloque = tx.bloqueEvaluacion(listaElementos, listaCriterios);
    return base.replace('{contextoElementos}', () => bloque);
  }

  // Páginas de captura restantes: sustituyen {contextoGeneral} por las líneas de context.lineas
  // (o por el aviso de que aún no hay datos). Los prompts sin marcador (descripcion, diagrama) no cambian.
  if (base.includes('{contextoGeneral}')) {
    const lineas = listaDeLineas(context && context.lineas);
    const bloque = lineas.length ? tx.bloqueContexto(lineas) : tx.sinContexto;
    return base.replace('{contextoGeneral}', () => bloque);
  }

  // necesidades (y descripcion/diagrama): el prompt no lleva marcadores, se usa tal cual.
  return base;
}

/**
 * Convierte nuestro historial interno { role: 'user' | 'assistant', content }
 * al formato que espera Gemini: { role: 'user' | 'model', parts: [{ text }] }
 * @param {Array<{role:string, content:string}>} messages  Historial completo (el servidor no guarda estado).
 * @returns {Array<{role:string, parts:Array<{text:string}>}>} Cualquier role distinto de
 *   'assistant' se trata como 'user'. Descarta mensajes mal formados y recorta el historial
 *   (MAX_MENSAJES, MAX_CARACTERES_MENSAJE); puede devolver [] (el handler responde 400).
 */
function toGeminiContents(messages) {
  // Solo mensajes bien formados (objeto con content de tipo texto no vacío), los más recientes
  // (MAX_MENSAJES) y con cada texto recortado a MAX_CARACTERES_MENSAJE.
  const validos = messages
    .filter(m => m && typeof m === 'object' && typeof m.content === 'string' && m.content.trim() !== '')
    .slice(-MAX_MENSAJES);
  // Gemini exige que la conversación empiece con un mensaje del usuario: si el recorte dejó
  // al frente una respuesta del asistente, se descarta.
  while (validos.length && validos[0].role === 'assistant') validos.shift();
  return validos.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content.slice(0, MAX_CARACTERES_MENSAJE) }]
  }));
}

/**
 * Manejador de la función (Vercel: export CommonJS con firma (req, res) estilo Node/Express).
 * Orden de validaciones: CORS/OPTIONS -> método POST -> existe GEMINI_API_KEY -> page válida ->
 * messages con al menos un mensaje válido -> llamada a Gemini.
 * @param {Object} req  Petición; req.body ya viene parseado como JSON por Vercel.
 * @param {Object} res  Respuesta (status(), json(), setHeader(), end()).
 * @returns {Promise<void>}
 */
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight CORS: el navegador lo envía antes del POST con JSON si el origen es distinto.
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: TEXTOS[IDIOMA_POR_DEFECTO].errMetodo });
    return;
  }

  const { page, messages, context, lang, audio } = req.body || {};
  // Idioma del usuario ('es' | 'en'): decide el prompt y el idioma de los mensajes de error.
  const tx = TEXTOS[normalizarIdioma(lang)];

  if (!process.env.GEMINI_API_KEY) {
    res.status(500).json({ error: tx.errSinClave });
    return;
  }

  // buildSystemPrompt va en su propio try: un `context` raro devuelve 400 en lugar de reventar.
  let systemPrompt;
  try {
    systemPrompt = buildSystemPrompt(page, context, lang);
  } catch (err) {
    res.status(400).json({ error: tx.errContexto });
    return;
  }
  if (systemPrompt) systemPrompt += `\n\n${tx.notaVoz}`;
  if (!systemPrompt) {
    res.status(400).json({ error: tx.errPagina });
    return;
  }

  const contents = Array.isArray(messages) ? toGeminiContents(messages) : [];
  if (contents.length === 0) {
    res.status(400).json({ error: tx.errHistorial });
    return;
  }

  // Audio opcional: se valida (objeto con tipo permitido y base64 no vacío ni mayor que el tope) y se
  // añade como parte inline_data al ÚLTIMO mensaje, que debe ser del usuario. Si algo no cuadra,
  // HTTP 400: es mejor avisar que enviar a Gemini algo que no podrá usar.
  if (audio !== undefined && audio !== null) {
    const valido = typeof audio === 'object'
      && TIPOS_AUDIO.includes(audio.mimeType)
      && typeof audio.data === 'string'
      && audio.data.length > 0
      && audio.data.length <= MAX_AUDIO_BASE64
      && /^[A-Za-z0-9+/]+={0,2}$/.test(audio.data);
    const ultimo = contents[contents.length - 1];
    if (!valido || ultimo.role !== 'user') {
      res.status(400).json({ error: tx.errAudio });
      return;
    }
    ultimo.parts.push({ inline_data: { mime_type: audio.mimeType, data: audio.data } });
    systemPrompt += `\n\n${tx.notaAudio}`;
  }

  try {
    // system_instruction = prompt del sistema; contents = historial convertido al formato Gemini.
    // generationConfig limita la longitud de la salida (ver MAX_OUTPUT_TOKENS).
    const { apiResponse, data } = await llamarGemini({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: {
        maxOutputTokens: MAX_OUTPUT_TOKENS
      }
    });

    if (!apiResponse.ok) {
      console.error('Error de la API de Gemini:', data);
      res.status(apiResponse.status).json({
        error: (data.error && data.error.message) || tx.errGemini
      });
      return;
    }

    // Se usa solo el primer candidato; sus parts de texto se concatenan (el modelo puede
    // partir la respuesta en varios trozos). trim() quita saltos de línea sobrantes.
    const candidate = (data.candidates || [])[0];
    const parts = (candidate && candidate.content && candidate.content.parts) || [];
    const reply = parts.map(p => p.text || '').join('').trim();

    if (!reply) {
      // Puede pasar si Gemini bloqueó la respuesta por sus filtros de seguridad
      const motivo = candidate && candidate.finishReason;
      res.status(200).json({
        reply: '',
        error: motivo ? tx.errSinRespuesta(motivo) : undefined
      });
      return;
    }

    res.status(200).json({ reply });
  } catch (err) {
    console.error('Error inesperado en /api/assistant:', err);
    res.status(500).json({ error: tx.errInesperado });
  }
};
