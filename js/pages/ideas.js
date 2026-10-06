/**
 * ideas.html — Ideas / conceptos iniciales (hasta 5).
 *
 * Guarda en projectData: concepto1..5.
 * Permite guardar/cargar como .txt (formato IDEAS_CONCEPTOS_V1) y recibe el
 * contenido generado por el asistente de IA (PFM.page.importText).
 *
 * DOM que usa (ideas.html):
 *   input.concepto[data-id=N]   idea N (N = 1..5), tabla de 5 filas fijas
 *   #guardarIdeasBtn, #cargarIdeasBtn, #cargarIdeasInput (file oculto)
 *   #guardarBtn / #continuarBtn / #anteriorBtn   los conecta PFM.page.init
 *
 * Claves de projectData: conceptoN = texto de la idea (trim). Una idea vacía se
 * considera "no definida": PFM.elementos.getIdeas (shared/elementos.js) solo devuelve
 * las que tienen texto, y de ahí salen evaluacion, seleccionEvaluar, morfologia, etc.
 *
 * Formato del .txt:  IDEAS_CONCEPTOS_V1  y luego  "id<TAB>idea"  por línea.
 *
 * Flujo: al cargar rellena los inputs; Guardar/Continuar guardan en localStorage.
 */
(function () {
    'use strict';

    const data = PFM.storage.load();

    // CONFIGURABLE: máximo de ideas. Debe coincidir con PFM.elementos.MAX_IDEAS
    // (shared/elementos.js) y con las 5 filas input.concepto de ideas.html; además
    // las páginas que construyen claves concepto<N> (evaluacion, morfologia, gc1,
    // evalConceptos, PDF grupos.js) asumen 1..5. Subirlo exige añadir filas al HTML.
    const NUM_IDEAS = 5;

    // CUIDADO: cabecera del .txt; se detecta por prefijo 'IDEAS_CONCEPTOS' al importar.
    const TXT_HEADER = 'IDEAS_CONCEPTOS_V1';

    const ideaEl = id => document.querySelector(`.concepto[data-id="${id}"]`);

    /** Guarda cada input .concepto en la clave concepto<data-id> (el id sale del HTML). */
    function saveData() {
        document.querySelectorAll('.concepto').forEach(el => {
            // Clave dinámica: concepto1..concepto5
            data[`concepto${el.dataset.id}`] = el.value.trim();
        });
        PFM.storage.save(data);
    }

    /** Rellena los inputs con lo guardado ('' si no hay nada). */
    function loadSavedData() {
        document.querySelectorAll('.concepto').forEach(el => {
            el.value = data[`concepto${el.dataset.id}`] || '';
        });
    }

    // ---------- Exportar / importar .txt ----------

    /**
     * Una línea de cabecera + una por idea: "id<TAB>idea".
     * @returns {string} contenido del archivo, líneas unidas con '\n'.
     */
    function construirContenidoTXT() {
        const lineas = [TXT_HEADER];
        for (let i = 1; i <= NUM_IDEAS; i++) {
            const el = ideaEl(i);
            lineas.push(`${i}\t${el ? el.value.trim() : ''}`);
        }
        return lineas.join('\n');
    }

    /** Guarda el proyecto y descarga el .txt (nombre: <proyecto>_ideas_conceptos.txt). */
    function guardarIdeasTXT() {
        saveData();
        // 'ideas' es el nombre de respaldo si el proyecto no tiene nombre
        const base = PFM.fileIO.safeName(data.projectName, 'ideas');
        PFM.fileIO.downloadText(`${base}_ideas_conceptos.txt`, construirContenidoTXT());
    }

    /**
     * Rellena los inputs con el contenido de un .txt. También lo usa el asistente de IA.
     * @param {string} texto contenido completo del archivo.
     */
    function aplicarContenidoTXT(texto) {
        PFM.fileIO.contentLines(texto, 'IDEAS_CONCEPTOS').forEach(linea => {
            // Mínimo 2 campos (id, idea); con menos se reintenta separando por ; o ,
            const campos = PFM.fileIO.splitFields(linea, 2);
            if (campos.length < 2) return;

            // Ignora filas con id no numérico o fuera de 1..NUM_IDEAS
            const id = parseInt(campos[0], 10);
            if (!id || id < 1 || id > NUM_IDEAS) return;

            const el = ideaEl(id);
            // Si la idea contenía tabuladores, se re-unen los campos restantes para no perder texto
            if (el) el.value = campos.slice(1).join('\t').trim();
        });
        saveData();
    }

    document.addEventListener('DOMContentLoaded', function () {
        loadSavedData();
        PFM.page.init({ page: 'ideas.html', save: saveData });

        document.getElementById('guardarIdeasBtn').addEventListener('click', guardarIdeasTXT);

        // Botón visible "Cargar" -> abre el <input type=file> oculto -> readSelectedFile lo lee
        const cargarBtn = document.getElementById('cargarIdeasBtn');
        const cargarInput = document.getElementById('cargarIdeasInput');
        cargarBtn.addEventListener('click', () => cargarInput.click());
        cargarInput.addEventListener('change', event =>
            PFM.fileIO.readSelectedFile(event, aplicarContenidoTXT, 'ideas'));

        PFM.page.importText = aplicarContenidoTXT; // lo usa el asistente de IA
    });
})();
