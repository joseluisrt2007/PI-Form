// ============================================================================
// js/features/assistant.js  ->  Widget del Asistente IA (sin namespace propio:
// es una IIFE que usa PFM.storage y PFM.page, no publica nada en PFM).
//
// Se carga SOLO en necesidades.html, ideas.html y evaluacion.html, al final del
// <body>, indicando la página en el atributo data-page del <script>:
//     <script src="js/features/assistant.js" data-page="necesidades"></script>
// (valores válidos: 'necesidades' | 'ideas' | 'evaluacion'). Sin data-page el
// widget no se crea. Estilos: css/components/asistente.css (clases asistente-*).
//
// Qué hace: inyecta un botón flotante + un panel de chat, envía el historial a
// /api/assistant (api/assistant.js) y muestra la respuesta. Si la respuesta trae
// un bloque [ARCHIVO_TXT]...[/ARCHIVO_TXT] (el mismo formato .txt que guardan y
// cargan js/pages/necesidades.js, ideas.js y evaluacion.js), ofrece dos botones:
//   - Insertar: llama a PFM.page.importText(texto) (cada página lo asigna a su
//     función aplicarContenidoTXT).
//   - Descargar: baja el bloque como <página>_generado.txt.
//
// DICTADO POR VOZ: el botón 🎤 junto al cuadro de texto usa el reconocimiento de voz del
// navegador (Web Speech API: SpeechRecognition / webkitSpeechRecognition). Funciona en Chrome y
// Edge, NO en Firefox; el navegador pide permiso de micrófono y esto solo es fiable con la página en
// HTTPS (Vercel) o en localhost. El texto dictado se escribe en el cuadro para que la persona lo
// revise y pulse Enviar; no se envía solo. El idioma de reconocimiento sigue al de la página
// (VOZ_LOCALES). El audio lo procesa el servicio de voz del navegador (en Chrome, Google).
//
// API PÚBLICA: ninguna (todo es privado a la IIFE). Se auto-inicia en DOMContentLoaded.
//
// DEPENDENCIAS Y ORDEN DE CARGA: debe ir DESPUÉS de core/storage.js (lee projectData)
// y de js/pages/<página>.js (que define PFM.page.importText). Usa document.currentScript,
// por eso debe cargarse con <script src> clásico (no dinámico ni async).
//
// localStorage: SOLO LEE projectData (vía PFM.storage.load()): criterio1..5 y
// concepto1..5. No escribe nada. El historial del chat vive en memoria: se pierde
// al recargar o cambiar de página.
//
// IDIOMA: los textos del widget (título, saludo, botones, errores) están en i18n/es.js y en.js
// (claves assistant_*) y cambian al cambiar de idioma. Cada petición manda `lang` a
// api/assistant.js, que usa el prompt del idioma correspondiente (es | en). Si el usuario
// cambia de idioma con la charla ya empezada, el historial se conserva tal cual.
// ============================================================================

(function () {
    'use strict';

    // CONFIGURABLE: URL de la función serverless. Ruta relativa a la raíz del sitio: solo
    // funciona desplegado (Vercel). Debe coincidir con el nombre del archivo api/assistant.js
    // (Vercel publica api/<nombre>.js como /api/<nombre>). Abierto con file:// el fetch falla
    // y se muestra el mensaje de "No se pudo contactar al asistente".
    const ASSISTANT_ENDPOINT = '/api/assistant';

    const t = PFM.i18n.t;

    // CONFIGURABLE: idioma de reconocimiento de voz según el idioma de la página (código BCP 47).
    // Al agregar un idioma a la app, añadir aquí su entrada; si falta se usa 'es-MX'.
    const VOZ_LOCALES = { es: 'es-MX', en: 'en-US' };
    // Constructor del reconocimiento de voz (undefined si el navegador no lo soporta, p. ej. Firefox).
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    // Estado del dictado: reconocedor activo (o null) y texto que ya había en el cuadro al empezar.
    let reconocimiento = null;
    let textoBaseDictado = '';

    // Nombre de la página (data-page del <script>). document.currentScript solo es válido mientras
    // se ejecuta el script de forma síncrona (por eso se lee aquí, fuera de los manejadores).
    // Si falta el atributo queda undefined/null y init() no crea el widget.
    const PAGE_NAME = document.currentScript && document.currentScript.dataset.page;

    /** @returns {string|null} Nombre de la página que activó el asistente, o null si no hay. */
    function getPage() {
        return PAGE_NAME || null;
    }

    /** @returns {Object} projectData completo (copia nueva; ver PFM.storage.load). */
    function getProjectData() {
        return PFM.storage.load();
    }

    /**
     * Arma el objeto `context` que se envía al servidor para que el prompt incluya datos reales.
     * @param {string} page  'necesidades' | 'ideas' | 'evaluacion'.
     * @returns {Object} necesidades -> {} ; ideas -> { criterios: string[] } ;
     *   evaluacion -> { elementos: [{tipo:'concepto', idx, nombre}], criterios: string[] }.
     *   La forma debe coincidir con lo que lee buildSystemPrompt en api/assistant.js.
     */
    function buildContext(page) {
        const data = getProjectData();

        if (page === 'ideas') {
            const criterios = [];
            // CONFIGURABLE: 5 = nº de criterios (criterio1..criterio5, los escribe necesidades.html).
            // Es el mismo valor que PFM.scoring.NUM_CRITERIOS; si se cambia hay que cambiar ambos
            // (y el prompt de api/assistant.js, que habla de "criterio del 1 al 5").
            for (let i = 1; i <= 5; i++) {
                if (data[`criterio${i}`]) criterios.push(data[`criterio${i}`]);
            }
            return { criterios };
        }

        if (page === 'evaluacion') {
            const elementos = [];
            // CONFIGURABLE: 5 = nº máximo de ideas (concepto1..concepto5, las escribe ideas.html);
            // igual a PFM.elementos.MAX_IDEAS. Solo se envían las ideas con texto; `idx` conserva el
            // número original (1..5) porque el .txt de evaluación lo usa para identificar la idea.
            for (let i = 1; i <= 5; i++) {
                if (data[`concepto${i}`]) {
                    elementos.push({ tipo: 'concepto', idx: i, nombre: data[`concepto${i}`] });
                }
            }
            const criterios = [];
            for (let i = 1; i <= 5; i++) {
                if (data[`criterio${i}`]) criterios.push(data[`criterio${i}`]);
            }
            return { elementos, criterios };
        }

        return {};
    }

    // Historial de la conversación, formato { role: 'user' | 'assistant', content: string }.
    // Se envía COMPLETO en cada petición (la API no guarda estado). Incluye el saludo inicial.
    // Crece durante la charla, pero api/assistant.js solo usa los últimos MAX_MENSAJES mensajes
    // (y recorta cada uno a MAX_CARACTERES_MENSAJE), así que una charla larga no rompe la petición.
    let historial = [];
    // Último bloque [ARCHIVO_TXT] recibido (texto ya recortado); lo usan Insertar y Descargar.
    let ultimoArchivoGenerado = null;
    // Referencias a los elementos del DOM creados en crearUI() (se rellena allí).
    let dom = {};

    /**
     * Crea el botón flotante y el panel de chat, los añade al <body> y conecta los eventos.
     * Los IDs (asistente*) son privados de este widget (no existen en ningún HTML; se crean aquí)
     * y los estilos están en css/components/asistente.css. La clase "oculto" es de ese CSS
     * (display:none) y se usa para mostrar/ocultar el panel y el aviso de archivo listo.
     */
    function crearUI() {
        const boton = document.createElement('button');
        boton.id = 'asistenteToggleBtn';
        boton.className = 'asistente-toggle';
        boton.type = 'button';
        boton.title = t('assistant_toggle');
        boton.setAttribute('data-i18n-title', 'assistant_toggle');
        boton.textContent = '🤖';

        const panel = document.createElement('div');
        panel.id = 'asistentePanel';
        panel.className = 'asistente-panel oculto';
        // Plantilla del panel. Los textos visibles salen de i18n (claves assistant_*, vía data-i18n);
        // se editan en i18n/es.js y en.js. Si se cambian los id="asistente..." hay que cambiar también los
        // querySelector de más abajo y el CSS. rows="1": altura inicial del textarea.
        panel.innerHTML = `
            <div class="asistente-header">
                <span data-i18n="assistant_title">🤖 Asistente IA</span>
                <button type="button" id="asistenteCerrarBtn" class="asistente-cerrar" data-i18n-title="assistant_close" title="Cerrar">✕</button>
            </div>
            <div class="asistente-mensajes" id="asistenteMensajes"></div>
            <div class="asistente-archivo-listo oculto" id="asistenteArchivoListo">
                <p data-i18n="assistant_file_ready">📄 El asistente generó un archivo listo para usar.</p>
                <div class="asistente-archivo-botones">
                    <button type="button" id="asistenteInsertarBtn" class="btn-secondary" data-i18n="assistant_insert">📥 Insertar en el formulario</button>
                    <button type="button" id="asistenteDescargarBtn" class="btn-secondary" data-i18n="assistant_download">💾 Descargar .txt</button>
                </div>
            </div>
            <form id="asistenteForm" class="asistente-form">
                <textarea id="asistenteInput" data-i18n-placeholder="assistant_placeholder" placeholder="Escribe aquí..." rows="1"></textarea>
                <button type="button" class="asistente-mic" id="asistenteMicBtn" data-i18n-title="assistant_mic" title="Dictar por voz" aria-pressed="false">🎤</button>
                <button type="submit" class="asistente-enviar" id="asistenteEnviarBtn" data-i18n-title="assistant_send" title="Enviar">➤</button>
            </form>
        `;

        document.body.appendChild(boton);
        document.body.appendChild(panel);
        // El DOM del widget se crea después del primer applyTranslations de la página: traducirlo ahora.
        PFM.i18n.applyTranslations();

        dom = {
            boton,
            panel,
            mensajes: panel.querySelector('#asistenteMensajes'),
            form: panel.querySelector('#asistenteForm'),
            input: panel.querySelector('#asistenteInput'),
            enviarBtn: panel.querySelector('#asistenteEnviarBtn'),
            micBtn: panel.querySelector('#asistenteMicBtn'),
            cerrarBtn: panel.querySelector('#asistenteCerrarBtn'),
            archivoListo: panel.querySelector('#asistenteArchivoListo'),
            insertarBtn: panel.querySelector('#asistenteInsertarBtn'),
            descargarBtn: panel.querySelector('#asistenteDescargarBtn')
        };

        boton.addEventListener('click', () => {
            panel.classList.toggle('oculto');
            if (panel.classList.contains('oculto')) detenerDictado();
        });
        dom.cerrarBtn.addEventListener('click', () => {
            panel.classList.add('oculto');
            detenerDictado();
        });
        dom.micBtn.addEventListener('click', alternarDictado);
        dom.form.addEventListener('submit', onEnviar);
        dom.insertarBtn.addEventListener('click', insertarArchivo);
        dom.descargarBtn.addEventListener('click', descargarArchivo);
    }

    // ---------- Dictado por voz ----------

    /** Muestra u oculta el estado "escuchando" del botón y del cuadro de texto. */
    function marcarEscuchando(activo) {
        dom.micBtn.classList.toggle('escuchando', activo);
        dom.micBtn.setAttribute('aria-pressed', String(activo));
        dom.micBtn.title = t(activo ? 'assistant_mic_stop' : 'assistant_mic');
        dom.input.placeholder = t(activo ? 'assistant_listening' : 'assistant_placeholder');
    }

    /** Detiene el dictado si está activo (el texto reconocido se conserva en el cuadro). */
    function detenerDictado() {
        if (reconocimiento) reconocimiento.stop();
    }

    /** Mensaje (clave i18n) que corresponde a un código de error de SpeechRecognition. */
    function claveErrorVoz(codigo) {
        if (codigo === 'not-allowed' || codigo === 'service-not-allowed') return 'assistant_voice_denied';
        if (codigo === 'no-speech') return 'assistant_voice_no_speech';
        if (codigo === 'audio-capture') return 'assistant_voice_no_mic';
        if (codigo === 'network') return 'assistant_voice_network';
        return 'assistant_voice_error';
    }

    /**
     * Botón 🎤: inicia o detiene el dictado. Mientras escucha, el texto reconocido (provisional
     * incluido) se escribe a continuación de lo que ya hubiera en el cuadro. No envía nada solo.
     */
    function alternarDictado() {
        if (reconocimiento) { detenerDictado(); return; }
        if (!SpeechRecognitionAPI) {
            agregarMensaje('assistant', `⚠️ ${t('assistant_voice_unsupported')}`);
            return;
        }

        const rec = new SpeechRecognitionAPI();
        rec.lang = VOZ_LOCALES[PFM.i18n.getLang()] || 'es-MX';
        rec.continuous = true;      // sigue escuchando aunque la persona haga pausas
        rec.interimResults = true;  // muestra el texto mientras se habla
        textoBaseDictado = dom.input.value.trim();

        rec.onresult = evt => {
            // Se reconstruye todo el dictado de esta sesión (finales + provisional) en cada evento.
            let dictado = '';
            for (let i = 0; i < evt.results.length; i++) dictado += evt.results[i][0].transcript;
            dom.input.value = [textoBaseDictado, dictado.trim()].filter(Boolean).join(' ');
        };
        rec.onerror = evt => {
            // 'aborted' ocurre al detener a mano: no es un error para la persona.
            if (evt.error !== 'aborted') agregarMensaje('assistant', `⚠️ ${t(claveErrorVoz(evt.error))}`);
        };
        rec.onend = () => {
            reconocimiento = null;
            marcarEscuchando(false);
            dom.input.focus();
        };

        reconocimiento = rec;
        try {
            rec.start();
            marcarEscuchando(true);
        } catch (err) {
            reconocimiento = null;
            marcarEscuchando(false);
            agregarMensaje('assistant', `⚠️ ${t('assistant_voice_error')}`);
        }
    }

    /**
     * Añade una burbuja al chat y baja el scroll al final.
     * @param {'user'|'assistant'} rol  Define la clase CSS asistente-msg-<rol> (alineación/color).
     * @param {string} texto            Se inserta con textContent (no interpreta HTML: seguro ante inyección).
     */
    function agregarMensaje(rol, texto) {
        const burbuja = document.createElement('div');
        burbuja.className = `asistente-msg asistente-msg-${rol}`;
        burbuja.textContent = texto;
        dom.mensajes.appendChild(burbuja);
        dom.mensajes.scrollTop = dom.mensajes.scrollHeight;
    }

    /**
     * Extrae el contenido del bloque [ARCHIVO_TXT]...[/ARCHIVO_TXT] de la respuesta.
     * @param {string} texto  Respuesta completa del modelo.
     * @returns {string|null} Contenido entre las marcas (con trim), o null si no hay bloque.
     */
    function extraerArchivo(texto) {
        // Regex: \[ARCHIVO_TXT\] y \[\/ARCHIVO_TXT\] son las marcas literales (los corchetes se escapan);
        // ([\s\S]*?) captura cualquier carácter incluidos saltos de línea, de forma perezosa (*?)
        // para parar en la PRIMERA marca de cierre. Sin flag g: solo se usa el primer bloque.
        // CUIDADO: las marcas deben coincidir con las del prompt en api/assistant.js; si un modelo
        // las escribe distinto, el archivo no se detecta.
        const match = texto.match(/\[ARCHIVO_TXT\]([\s\S]*?)\[\/ARCHIVO_TXT\]/);
        return match ? match[1].trim() : null;
    }

    /**
     * Manejador del submit del formulario: envía el mensaje, llama a la API y pinta la respuesta.
     * Flujo: valida texto no vacío -> añade burbuja y entrada al historial -> deshabilita Enviar
     * -> muestra "Escribiendo..." -> POST -> quita el indicador -> muestra texto y detecta el archivo.
     * @param {SubmitEvent} evt
     * @returns {Promise<void>}
     */
    async function onEnviar(evt) {
        evt.preventDefault();
        // Al enviar se corta el dictado y se ignora cualquier resultado tardío, para que no
        // reescriba el cuadro ya vaciado.
        if (reconocimiento) { reconocimiento.onresult = null; detenerDictado(); }
        const texto = dom.input.value.trim();
        if (!texto) return;

        agregarMensaje('user', texto);
        historial.push({ role: 'user', content: texto });
        dom.input.value = '';
        dom.enviarBtn.disabled = true;

        // Burbuja temporal "Escribiendo..." (clase asistente-pensando); se elimina con remove() al
        // llegar la respuesta o al fallar.
        const pensando = document.createElement('div');
        pensando.className = 'asistente-msg asistente-msg-assistant asistente-pensando';
        pensando.textContent = t('assistant_typing');
        dom.mensajes.appendChild(pensando);
        dom.mensajes.scrollTop = dom.mensajes.scrollHeight;

        try {
            const page = getPage();
            // Petición: POST JSON { page, messages: historial, context }. Respuesta esperada:
            // { reply: string } con HTTP 200, o { error: string } con HTTP de error (ver api/assistant.js).
            const respuesta = await fetch(ASSISTANT_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    page,
                    lang: PFM.i18n.getLang(),
                    messages: historial,
                    context: buildContext(page)
                })
            });

            const datos = await respuesta.json();
            pensando.remove();

            // Error HTTP (400/405/500 propios o el código que devolvió Gemini): se muestra el mensaje del
            // servidor. Nota: el mensaje del usuario ya quedó en `historial`, así que se reenviará en el
            // siguiente intento aunque esta petición haya fallado.
            if (!respuesta.ok) {
                agregarMensaje('assistant', `⚠️ ${datos.error || t('assistant_error_generic')}`);
                return;
            }

            // Si el servidor respondió 200 con reply vacío (p. ej. bloqueo de seguridad de Gemini),
            // `datos.reply` es '' y no se muestra nada (el campo `error` opcional de ese caso no se lee aquí).
            const archivo = extraerArchivo(datos.reply || '');
            // Texto visible = respuesta sin el bloque [ARCHIVO_TXT] (el archivo no se muestra en el chat).
            // Se guarda en el historial la respuesta COMPLETA (con el bloque) para que el modelo recuerde
            // qué archivo generó.
            const textoVisible = (datos.reply || '')
                .replace(/\[ARCHIVO_TXT\][\s\S]*?\[\/ARCHIVO_TXT\]/, '')
                .trim();

            if (textoVisible) agregarMensaje('assistant', textoVisible);
            historial.push({ role: 'assistant', content: datos.reply });

            if (archivo) {
                ultimoArchivoGenerado = archivo;
                dom.archivoListo.classList.remove('oculto');
            }
        } catch (err) {
            pensando.remove();
            agregarMensaje('assistant', `⚠️ ${t('assistant_error_network')}`);
            console.error('Error del asistente IA:', err);
        } finally {
            dom.enviarBtn.disabled = false;
        }
    }

    /**
     * Botón "Insertar en el formulario": pasa el último archivo generado a la página.
     * Usa PFM.page.importText, que cada página asigna (necesidades.js, ideas.js, evaluacion.js);
     * si la página no la definió se avisa con alert y se sugiere Descargar + Cargar.
     */
    function insertarArchivo() {
        if (!ultimoArchivoGenerado) return;
        if (typeof PFM.page.importText === 'function') {
            PFM.page.importText(ultimoArchivoGenerado);
            agregarMensaje('assistant', t('assistant_inserted'));
            dom.archivoListo.classList.add('oculto');
        } else {
            alert(t('assistant_insert_failed'));
        }
    }

    /**
     * Botón "Descargar .txt": baja el último archivo generado. Duplica la lógica de
     * PFM.fileIO.downloadText (este widget no depende de core/file-io.js, que no se carga
     * en todas las páginas del asistente).
     * El nombre es <data-page>_generado.txt; la codificación utf-8 debe coincidir con la
     * lectura de PFM.fileIO.readSelectedFile para conservar las tildes al volver a cargarlo.
     */
    function descargarArchivo() {
        if (!ultimoArchivoGenerado) return;
        const blob = new Blob([ultimoArchivoGenerado], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${getPage() || 'asistente'}_generado.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Saludo inicial según la página, en el idioma actual.
     * @param {string} page  'necesidades' | 'ideas' | 'evaluacion'.
     * @returns {string} Texto del saludo (o uno genérico si la página no tiene clave propia).
     * CONFIGURABLE: los textos están en i18n/es.js y en.js (assistant_greeting_<página>); al añadir una
     * página con asistente hay que añadir también esa clave en ambos idiomas, su entrada en
     * buildContext, su prompt en SYSTEM_PROMPTS (api/assistant.js) y el <script data-page> en su HTML.
     */
    function mensajeInicial(page) {
        const clave = `assistant_greeting_${page}`;
        const texto = t(clave);
        // t() devuelve la propia clave si no existe: en ese caso, saludo genérico.
        return texto === clave ? t('assistant_greeting_default') : texto;
    }

    /**
     * Si el usuario cambia de idioma antes de escribir nada, el saludo se vuelve a mostrar en el
     * nuevo idioma (burbuja e historial). Con la charla empezada no se toca nada.
     */
    function retraducirSaludo() {
        if (!dom.mensajes || historial.length !== 1) return;
        const saludo = mensajeInicial(getPage());
        const burbuja = dom.mensajes.querySelector('.asistente-msg-assistant');
        if (burbuja) burbuja.textContent = saludo;
        historial[0].content = saludo;
    }

    /** Crea el widget (si la página lo activó) y publica el saludo, que también entra al historial. */
    function init() {
        const page = getPage();
        if (!page) return; // Esta página no activó el asistente

        crearUI();

        const saludo = mensajeInicial(page);
        agregarMensaje('assistant', saludo);
        historial.push({ role: 'assistant', content: saludo });
        window.addEventListener('translationsApplied', retraducirSaludo);
    }

    // Espera al DOM porque crearUI() añade elementos a document.body.
    document.addEventListener('DOMContentLoaded', init);
})();
