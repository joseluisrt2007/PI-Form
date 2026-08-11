// ============================================================================
// Función serverless (Vercel) - Proxy seguro hacia la API de Gemini (Google)
//
// Se usa Gemini en lugar de Claude porque su capa gratuita es permanente
// (sin tarjeta, sin fecha de expiración) — a diferencia del crédito de
// prueba único de la API de Anthropic. Consulta los límites vigentes en
// https://ai.google.dev antes de publicar el sitio, ya que Google los ajusta
// de vez en cuando.
//
// La API key vive ÚNICAMENTE en la variable de entorno GEMINI_API_KEY
// configurada en el panel de Vercel (Project Settings -> Environment
// Variables). Nunca se escribe aquí, nunca se sube al repositorio.
//
// Contrato con el frontend (js/asistente.js) — NO CAMBIA respecto a la
// versión anterior:
//   POST /api/assistant
//   body: { page: 'necesidades' | 'ideas' | 'evaluacion', messages: [...], context: {...} }
//   respuesta: { reply: string }
//
// El modelo se le instruye para que, cuando termine de ayudar al usuario,
// incluya en su respuesta un bloque:
//   [ARCHIVO_TXT]
//   ...contenido exacto del .txt...
//   [/ARCHIVO_TXT]
// que el frontend extrae y pasa a la función aplicarContenidoTXT() que ya
// existe en cada página (necesidades.js / ideas.js / evaluacion.js).
// ============================================================================

// Modelo recomendado en el nivel gratuito (buen balance calidad/límite de uso).
// Puedes cambiarlo por otro modelo gratuito listado en https://ai.google.dev/gemini-api/docs/models
const MODEL = 'gemini-flash-latest';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const MAX_OUTPUT_TOKENS = 1024;

// Cambia esto por tu dominio (p. ej. 'https://tuusuario.github.io') si quieres
// restringir quién puede llamar a esta función. '*' permite cualquier origen.
const ALLOWED_ORIGIN = '*';

const SYSTEM_PROMPTS = {
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

function buildSystemPrompt(page, context) {
  const base = SYSTEM_PROMPTS[page];
  if (!base) return null;

  if (page === 'ideas') {
    const criterios = (context && context.criterios) || [];
    const texto = criterios.length
      ? `Los criterios que el usuario ya definió para evaluar después estas ideas son: ${criterios.join(', ')}. Úsalos como referencia para sugerir ideas relevantes.`
      : '';
    return base.replace('{contextoCriterios}', texto);
  }

  if (page === 'evaluacion') {
    const elementos = (context && context.elementos) || [];
    const criterios = (context && context.criterios) || [];
    const listaElementos = elementos.length
      ? elementos.map(e => `- idx ${e.idx}: "${e.nombre}"`).join('\n')
      : '(el usuario todavía no tiene ideas registradas; dile que regrese a la página de Ideas primero)';
    const listaCriterios = criterios.length
      ? criterios.map((c, i) => `${i + 1}. ${c}`).join('\n')
      : '(no hay criterios registrados)';
    return base.replace(
      '{contextoElementos}',
      `IDEAS A EVALUAR:\n${listaElementos}\n\nCRITERIOS (numerados del 1 al 5):\n${listaCriterios}`
    );
  }

  return base;
}

/**
 * Convierte nuestro historial interno { role: 'user' | 'assistant', content }
 * al formato que espera Gemini: { role: 'user' | 'model', parts: [{ text }] }
 */
function toGeminiContents(messages) {
  return messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    res.status(500).json({ error: 'El servidor no tiene configurada la variable GEMINI_API_KEY.' });
    return;
  }

  const { page, messages, context } = req.body || {};

  const systemPrompt = buildSystemPrompt(page, context);
  if (!systemPrompt) {
    res.status(400).json({ error: 'Página no reconocida.' });
    return;
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Falta el historial de mensajes.' });
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
        contents: toGeminiContents(messages),
        generationConfig: {
          maxOutputTokens: MAX_OUTPUT_TOKENS
        }
      })
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      console.error('Error de la API de Gemini:', data);
      res.status(apiResponse.status).json({
        error: (data.error && data.error.message) || 'Error al contactar al asistente.'
      });
      return;
    }

    const candidate = (data.candidates || [])[0];
    const parts = (candidate && candidate.content && candidate.content.parts) || [];
    const reply = parts.map(p => p.text || '').join('').trim();

    if (!reply) {
      // Puede pasar si Gemini bloqueó la respuesta por sus filtros de seguridad
      const motivo = candidate && candidate.finishReason;
      res.status(200).json({
        reply: '',
        error: motivo ? `El asistente no generó respuesta (motivo: ${motivo}). Intenta reformular tu mensaje.` : undefined
      });
      return;
    }

    res.status(200).json({ reply });
  } catch (err) {
    console.error('Error inesperado en /api/assistant:', err);
    res.status(500).json({ error: 'Error inesperado del servidor.' });
  }
};
