# Asistente IA — Puesta en marcha (con Gemini, 100% gratis)

El código ya está completo y usa la **API gratuita de Gemini (Google)** en
lugar de la de Claude, porque su capa gratuita es permanente (sin tarjeta,
sin fecha de expiración) — a diferencia del crédito de prueba único de
Anthropic. Aun así, necesitas hacer una parte manual fuera de GitHub, porque
el asistente depende de una función de servidor que GitHub Pages no puede
ejecutar (GitHub solo sirve archivos estáticos).

Esto es lo que hay que hacer, una sola vez:

## 1. Consigue una API key gratuita de Gemini
1. Entra a [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
   (Google AI Studio) e inicia sesión con tu cuenta de Google.
2. Haz clic en **"Create API key"**. No pide tarjeta de crédito.
3. Copia la clave. Guárdala en un lugar seguro (un gestor de contraseñas,
   por ejemplo).
4. **No la pegues en ningún archivo del proyecto.**

> **Sobre los límites gratuitos:** el nivel gratuito de Gemini tiene límites
> de solicitudes por minuto y por día (varían según el modelo y Google los
> ajusta de vez en cuando). Para el uso normal de este proyecto — algunas
> decenas de conversaciones al día como mucho — el nivel gratuito es más
> que suficiente. Verifica los límites vigentes del modelo en
> [ai.google.dev/gemini-api/docs/rate-limits](https://ai.google.dev/gemini-api/docs/rate-limits)
> si esperas mucho tráfico.
>
> **Nota de privacidad:** en el nivel gratuito, Google puede usar los
> mensajes que se envían a la API para mejorar sus modelos. Si eso te
> preocupa, tenlo en cuenta antes de invitar a otras personas a usar el
> asistente con datos sensibles.

## 2. Sube este código a tu repositorio de GitHub
Como ya tienes el proyecto en GitHub, simplemente reemplaza el contenido del
repo con esta versión (o copia los archivos nuevos: `api/assistant.js`,
`js/asistente.js`, `css/asistente.css`, `.gitignore`, `.env.example`) y haz
`git push` como de costumbre.

## 3. Conecta el repositorio a Vercel (gratis)
GitHub Pages no puede ejecutar `api/assistant.js` porque solo sirve archivos
estáticos. Necesitas una plataforma que sí ejecute funciones — usamos Vercel
porque se conecta directo a GitHub y no requiere configuración adicional, y
su plan Hobby es gratuito de forma permanente para este tipo de proyecto.

1. Entra a [vercel.com](https://vercel.com) y crea una cuenta (puedes usar tu
   cuenta de GitHub para iniciar sesión).
2. Click en **Add New → Project**.
3. Elige tu repositorio de GitHub (`Py-Form-Manager_Web` o como se llame el tuyo).
4. Vercel detecta automáticamente que es un sitio estático con una función en
   `/api`. No necesitas cambiar ningún campo del formulario de importación.
5. **Antes de darle "Deploy"**, abre la sección **Environment Variables** y
   agrega:
   - Name: `GEMINI_API_KEY`
   - Value: la clave que copiaste en el paso 1
6. Dale **Deploy**. En un par de minutos tendrás una URL tipo
   `https://tu-proyecto.vercel.app` con el sitio completo funcionando,
   asistente incluido.

A partir de aquí, **cada vez que hagas `git push` a GitHub, Vercel actualiza
el sitio automáticamente** — no hay que repetir este proceso.

## 4. (Opcional) ¿Qué pasa con GitHub Pages?
Tienes dos caminos:

- **Más simple:** usar Vercel como tu hosting principal a partir de ahora
  (deja de usar GitHub Pages; solo usas GitHub como repositorio de código).
- **Mantener GitHub Pages para el sitio y Vercel solo para el asistente:**
  es posible, pero requiere cambiar la URL del `fetch` en `js/asistente.js`
  de `/api/assistant` a la URL completa de tu función en Vercel
  (por ejemplo `https://tu-proyecto.vercel.app/api/assistant`). El backend
  ya incluye las cabeceras CORS necesarias para que esto funcione desde un
  dominio distinto (GitHub Pages).

## 5. Verificación rápida
1. Abre tu sitio ya desplegado en Vercel.
2. Ve a la página de **Necesidades y prioridades**.
3. Deberías ver un botón flotante 🤖 en la esquina inferior derecha.
4. Escríbele algo como *"tengo una cafetería y quiero mejorar el tiempo de espera"*.
5. Cuando termine de conversar contigo, te ofrecerá un botón
   **"📥 Insertar en el formulario"** que rellena la tabla automáticamente.

## Costo real
Con el nivel gratuito de Gemini, el uso normal de este proyecto no genera
ningún cargo. Si en algún momento superas los límites gratuitos diarios,
la API simplemente devolverá un error temporal (el asistente mostrará un
mensaje de error) en vez de cobrarte — a menos que actives explícitamente
la facturación en tu proyecto de Google Cloud, algo que no es necesario
para usar el nivel gratuito.
