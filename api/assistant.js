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
//   petición: { page: 'necesidades' | 'ideas' | 'evaluacion',
//               lang: 'es' | 'en'   (opcional; idioma del prompt y de los errores; por defecto 'es'),
//               messages: [{ role: 'user' | 'assistant', content: string }, ...],
//               context: {...} }      (forma de context según la página, ver buildSystemPrompt:
//                                      ideas -> { criterios: string[] };
//                                      evaluacion -> { elementos: [{idx, nombre}], criterios: string[] };
//                                      necesidades -> {} )
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
// EVALUACION_IDEAS_V1 y campos separados por TABULADOR) debe coincidir con lo que
// leen esas páginas con PFM.fileIO.contentLines / splitFields.
//
// Robustez: el historial se recorta (MAX_MENSAJES / MAX_CARACTERES_MENSAJE), `context` se valida
// (solo se aceptan listas de textos) y un context malformado devuelve HTTP 400 en lugar de
// una excepción no capturada.
// ============================================================================

// Modelo recomendado en el nivel gratuito (buen balance calidad/límite de uso).
// Puedes cambiarlo por otro modelo gratuito listado en https://ai.google.dev/gemini-api/docs/models
// CONFIGURABLE: modelo de Gemini. Se interpola en GEMINI_API_URL, así que basta cambiar esta línea.
// Cada modelo tiene sus propios límites de la capa gratuita; si el nombre no existe la API
// responde error y el widget muestra el mensaje de Gemini. No hay otro archivo que cambiar.
const MODEL = 'gemini-2.5-flash';
// Endpoint REST v1beta de generación de contenido (sin streaming). La API key NO va en la URL
// sino en la cabecera x-goog-api-key (ver el fetch más abajo).
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
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

// CONFIGURABLE: nº máximo de ideas/criterios aceptados en `context` (el proyecto tiene 5 de cada uno).
const MAX_ELEMENTOS_CONTEXTO = 10;

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

// Textos sueltos que buildSystemPrompt y el handler insertan, por idioma.
// CONFIGURABLE: al agregar un idioma, añadir aquí su entrada (y su prompt en SYSTEM_PROMPTS).
const TEXTOS = {
  es: {
    criteriosIdeas: lista => `Los criterios que el usuario ya definió para evaluar después estas ideas son: ${lista}. Úsalos como referencia para sugerir ideas relevantes.`,
    sinIdeas: '(el usuario todavía no tiene ideas registradas; dile que regrese a la página de Ideas primero)',
    sinCriterios: '(no hay criterios registrados)',
    bloqueEvaluacion: (elementos, criterios) => `IDEAS A EVALUAR:\n${elementos}\n\nCRITERIOS (numerados del 1 al 5):\n${criterios}`,
    notaVoz: 'Nota: el usuario puede escribir sus mensajes dictándolos por voz, así que pueden venir sin puntuación, con mayúsculas irregulares o con alguna palabra mal reconocida. Interpreta la intención con tolerancia y, si algo es ambiguo, pregúntalo. Los números pueden venir escritos con letras ("tres", "siete punto cinco"); conviértelos a cifras en el archivo.',
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
    bloqueEvaluacion: (elementos, criterios) => `IDEAS TO EVALUATE:\n${elementos}\n\nCRITERIA (numbered 1 to 5):\n${criterios}`,
    notaVoz: 'Note: the user may type messages by voice dictation, so they may lack punctuation, have irregular capitalization or contain a misrecognized word. Interpret the intent tolerantly and, if something is ambiguous, ask. Numbers may be spelled out ("three", "seven point five"); convert them to digits in the file.',
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

  // necesidades: el prompt no lleva marcadores, se usa tal cual.
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

  const { page, messages, context, lang } = req.body || {};
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

  try {
    const apiResponse = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        // (arriba) system_instruction = prompt del sistema; contents = historial convertido al formato Gemini.
        // generationConfig limita la longitud de la salida (ver MAX_OUTPUT_TOKENS).
        generationConfig: {
          maxOutputTokens: MAX_OUTPUT_TOKENS
        }
      })
    });

    // Se lee el JSON incluso en error: Gemini explica el fallo en data.error.message.
    // CUIDADO: si la respuesta no fuera JSON, .json() lanza y cae en el catch (HTTP 500 genérico).
    const data = await apiResponse.json();

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
