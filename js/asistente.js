// ============================================================================
// Widget del Asistente IA - compartido por necesidades.html, ideas.html y
// evaluacion.html. Cada página debe definir, ANTES de cargar este script:
//     <script>window.ASISTENTE_PAGINA = 'necesidades';</script>
// (o 'ideas' / 'evaluacion').
//
// Habla con /api/assistant (función serverless) y, cuando el asistente
// entrega un bloque [ARCHIVO_TXT]...[/ARCHIVO_TXT], lo pasa directamente a
// la función aplicarContenidoTXT() que ya existe en cada página, o permite
// descargarlo como .txt.
// ============================================================================

(function () {
    'use strict';

    const ASSISTANT_ENDPOINT = '/api/assistant';

    function getPage() {
        return window.ASISTENTE_PAGINA || null;
    }

    function getProjectData() {
        try {
            return JSON.parse(localStorage.getItem('projectData') || '{}');
        } catch (e) {
            return {};
        }
    }

    function buildContext(page) {
        const data = getProjectData();

        if (page === 'ideas') {
            const criterios = [];
            for (let i = 1; i <= 5; i++) {
                if (data[`criterio${i}`]) criterios.push(data[`criterio${i}`]);
            }
            return { criterios };
        }

        if (page === 'evaluacion') {
            const elementos = [];
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

    let historial = [];
    let ultimoArchivoGenerado = null;
    let dom = {};

    function crearUI() {
        const boton = document.createElement('button');
        boton.id = 'asistenteToggleBtn';
        boton.className = 'asistente-toggle';
        boton.type = 'button';
        boton.title = 'Asistente IA';
        boton.textContent = '🤖';

        const panel = document.createElement('div');
        panel.id = 'asistentePanel';
        panel.className = 'asistente-panel oculto';
        panel.innerHTML = `
            <div class="asistente-header">
                <span>🤖 Asistente IA</span>
                <button type="button" id="asistenteCerrarBtn" class="asistente-cerrar" title="Cerrar">✕</button>
            </div>
            <div class="asistente-mensajes" id="asistenteMensajes"></div>
            <div class="asistente-archivo-listo oculto" id="asistenteArchivoListo">
                <p>📄 El asistente generó un archivo listo para usar.</p>
                <div class="asistente-archivo-botones">
                    <button type="button" id="asistenteInsertarBtn" class="btn-secondary">📥 Insertar en el formulario</button>
                    <button type="button" id="asistenteDescargarBtn" class="btn-secondary">💾 Descargar .txt</button>
                </div>
            </div>
            <form id="asistenteForm" class="asistente-form">
                <textarea id="asistenteInput" placeholder="Escribe aquí..." rows="1"></textarea>
                <button type="submit" class="asistente-enviar" id="asistenteEnviarBtn" title="Enviar">➤</button>
            </form>
        `;

        document.body.appendChild(boton);
        document.body.appendChild(panel);

        dom = {
            boton,
            panel,
            mensajes: panel.querySelector('#asistenteMensajes'),
            form: panel.querySelector('#asistenteForm'),
            input: panel.querySelector('#asistenteInput'),
            enviarBtn: panel.querySelector('#asistenteEnviarBtn'),
            cerrarBtn: panel.querySelector('#asistenteCerrarBtn'),
            archivoListo: panel.querySelector('#asistenteArchivoListo'),
            insertarBtn: panel.querySelector('#asistenteInsertarBtn'),
            descargarBtn: panel.querySelector('#asistenteDescargarBtn')
        };

        boton.addEventListener('click', () => panel.classList.toggle('oculto'));
        dom.cerrarBtn.addEventListener('click', () => panel.classList.add('oculto'));
        dom.form.addEventListener('submit', onEnviar);
        dom.insertarBtn.addEventListener('click', insertarArchivo);
        dom.descargarBtn.addEventListener('click', descargarArchivo);
    }

    function agregarMensaje(rol, texto) {
        const burbuja = document.createElement('div');
        burbuja.className = `asistente-msg asistente-msg-${rol}`;
        burbuja.textContent = texto;
        dom.mensajes.appendChild(burbuja);
        dom.mensajes.scrollTop = dom.mensajes.scrollHeight;
    }

    function extraerArchivo(texto) {
        const match = texto.match(/\[ARCHIVO_TXT\]([\s\S]*?)\[\/ARCHIVO_TXT\]/);
        return match ? match[1].trim() : null;
    }

    async function onEnviar(evt) {
        evt.preventDefault();
        const texto = dom.input.value.trim();
        if (!texto) return;

        agregarMensaje('user', texto);
        historial.push({ role: 'user', content: texto });
        dom.input.value = '';
        dom.enviarBtn.disabled = true;

        const pensando = document.createElement('div');
        pensando.className = 'asistente-msg asistente-msg-assistant asistente-pensando';
        pensando.textContent = 'Escribiendo...';
        dom.mensajes.appendChild(pensando);
        dom.mensajes.scrollTop = dom.mensajes.scrollHeight;

        try {
            const page = getPage();
            const respuesta = await fetch(ASSISTANT_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    page,
                    messages: historial,
                    context: buildContext(page)
                })
            });

            const datos = await respuesta.json();
            pensando.remove();

            if (!respuesta.ok) {
                agregarMensaje('assistant', `⚠️ ${datos.error || 'Ocurrió un error al contactar al asistente.'}`);
                return;
            }

            const archivo = extraerArchivo(datos.reply || '');
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
            agregarMensaje('assistant', '⚠️ No se pudo contactar al asistente. Verifica tu conexión e inténtalo de nuevo.');
            console.error('Error del asistente IA:', err);
        } finally {
            dom.enviarBtn.disabled = false;
        }
    }

    function insertarArchivo() {
        if (!ultimoArchivoGenerado) return;
        if (typeof window.aplicarContenidoTXT === 'function') {
            window.aplicarContenidoTXT(ultimoArchivoGenerado);
            agregarMensaje('assistant', '✅ Los datos se insertaron en el formulario.');
            dom.archivoListo.classList.add('oculto');
        } else {
            alert('No se pudo insertar automáticamente. Usa "Descargar .txt" y cárgalo con el botón de esta página.');
        }
    }

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

    function mensajeInicial(page) {
        const mensajes = {
            necesidades: '¡Hola! Vamos a identificar juntos las necesidades y prioridades de tu proyecto. Cuéntame, ¿de qué trata tu proyecto o qué proceso quieres mejorar?',
            ideas: '¡Hola! Ayudémonos a generar ideas para tu proyecto. ¿Qué problema específico quieres resolver?',
            evaluacion: '¡Hola! Vamos a evaluar tus ideas frente a tus criterios. ¿Prefieres que revisemos idea por idea, o me das primero tu opinión general?'
        };
        return mensajes[page] || '¡Hola! ¿En qué te puedo ayudar?';
    }

    function init() {
        const page = getPage();
        if (!page) return; // Esta página no activó el asistente

        crearUI();

        const saludo = mensajeInicial(page);
        agregarMensaje('assistant', saludo);
        historial.push({ role: 'assistant', content: saludo });
    }

    document.addEventListener('DOMContentLoaded', init);
})();
