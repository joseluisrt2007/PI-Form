/**
 * necesidades.html — Criterios (necesidades) y pesos. Los pesos deben sumar 10
 * (si no suman 10 se muestra un aviso en #pesoError; no se bloquea el avance).
 *
 * Guarda en projectData: criterio1..5, peso1..5.
 * Permite guardar/cargar la tabla como .txt (formato NECESIDADES_PRIORIDADES_V1)
 * y recibe el contenido generado por el asistente de IA (PFM.page.importText).
 *
 * DOM que usa (necesidades.html):
 *   input.criterio[data-id=N]   texto del criterio N (N = 1..5)
 *   input.peso[data-id=N]       peso del criterio N (type=number, min=0, step=0.1)
 *   #guardarNecesidadesBtn, #cargarNecesidadesBtn, #cargarNecesidadesInput (file oculto)
 *   #guardarBtn / #continuarBtn / #anteriorBtn   los conecta PFM.page.init
 *
 * Claves de projectData (N = 1..5):
 *   criterioN   texto (trim)          pesoN   TEXTO numérico tal cual está en el input
 *                                             ('' si vacío); quien lo usa hace parseFloat
 *                                             (ver PFM.scoring.peso, que trata '' como 0).
 *
 * Formato del .txt (una línea por criterio, separadas por tabulador):
 *   NECESIDADES_PRIORIDADES_V1
 *   1<TAB>Costo<TAB>3
 *
 * Flujo: al cargar rellena los inputs con lo guardado; Guardar/Continuar escriben en
 * localStorage; Guardar/Cargar .txt exportan/importan el mismo contenido.
 *
 * Aviso de suma: mostrarAvisoPesos() escribe PFM.i18n.t('error_sum_weights') en #pesoError cuando
 * hay al menos un peso escrito y la suma no es 10; se actualiza al teclear, al guardar, al
 * importar un .txt y al cambiar de idioma. Los resultados ponderados (scoring.js) asumen pesos
 * que suman 10 para quedar en 0-100.
 */
(function () {
    'use strict';

    const data = PFM.storage.load();

    // CONFIGURABLE: nº de filas de criterios. Debe coincidir con las 5 filas fijas de
    // necesidades.html (class criterio/peso con data-id 1..5), con PFM.scoring.NUM_CRITERIOS
    // (shared/scoring.js), descripcion.js (numCriterios), evaluacion.js, evalConceptos y PDF.
    // Subirlo aquí sin añadir filas al HTML provoca un error (criterioEl devuelve null).
    const NUM_CRITERIOS = 5;

    // CUIDADO: cabecera del .txt. aplicarContenidoTXT la detecta por el prefijo
    // 'NECESIDADES_PRIORIDADES' (sin "_V1"); cambiarla invalida los archivos ya exportados.
    const TXT_HEADER = 'NECESIDADES_PRIORIDADES_V1';

    // Selectores de los inputs por número de criterio (atributo data-id del HTML)
    const criterioEl = id => document.querySelector(`.criterio[data-id="${id}"]`);
    const pesoEl = id => document.querySelector(`.peso[data-id="${id}"]`);

    // CONFIGURABLE: suma que deben dar los pesos. Debe coincidir con el texto de
    // 'error_sum_weights' (i18n/es.js y en.js), con el prompt del asistente (api/assistant.js,
    // "deben sumar 10") y con la escala 0-100 de PFM.scoring.
    const SUMA_PESOS = 10;

    /**
     * Muestra u oculta el aviso de que los pesos no suman SUMA_PESOS (#pesoError).
     * No hace nada si todavía no hay ningún peso escrito (para no avisar en una tabla vacía).
     * La tolerancia de 0.001 evita avisos falsos por decimales (p. ej. 0.1 + 0.2).
     */
    function mostrarAvisoPesos() {
        const aviso = document.getElementById('pesoError');
        if (!aviso) return;
        let suma = 0, hayPesos = false;
        for (let i = 1; i <= NUM_CRITERIOS; i++) {
            const texto = pesoEl(i).value.trim();
            if (texto !== '') hayPesos = true;
            suma += parseFloat(texto) || 0;
        }
        const mal = hayPesos && Math.abs(suma - SUMA_PESOS) > 0.001;
        aviso.textContent = mal ? PFM.i18n.t('error_sum_weights') : '';
    }

    /** Copia los inputs a data (claves criterioN / pesoN) y guarda en localStorage. */
    function saveData() {
        for (let i = 1; i <= NUM_CRITERIOS; i++) {
            // Claves dinámicas: criterio1..criterio5 y peso1..peso5 (leídas por scoring.js y PDF)
            data[`criterio${i}`] = criterioEl(i).value.trim();
            data[`peso${i}`] = pesoEl(i).value;
        }
        PFM.storage.save(data);
        mostrarAvisoPesos();
    }

    /** Rellena los inputs con lo guardado ('' si no hay nada). */
    function loadSavedData() {
        for (let i = 1; i <= NUM_CRITERIOS; i++) {
            criterioEl(i).value = data[`criterio${i}`] || '';
            pesoEl(i).value = data[`peso${i}`] || '';
        }
    }

    // ---------- Exportar / importar .txt ----------

    /**
     * Una línea de cabecera + una por fila: "id<TAB>criterio<TAB>peso".
     * @returns {string} contenido del archivo, líneas unidas con '\n'.
     */
    function construirContenidoTXT() {
        const lineas = [TXT_HEADER];
        for (let i = 1; i <= NUM_CRITERIOS; i++) {
            lineas.push(`${i}\t${criterioEl(i).value.trim()}\t${pesoEl(i).value.trim()}`);
        }
        return lineas.join('\n');
    }

    /** Guarda el proyecto y descarga el .txt (nombre: <proyecto>_necesidades_prioridades.txt). */
    function guardarNecesidadesTXT() {
        saveData();
        // 'necesidades' es el nombre de respaldo si el proyecto no tiene nombre
        const base = PFM.fileIO.safeName(data.projectName, 'necesidades');
        PFM.fileIO.downloadText(`${base}_necesidades_prioridades.txt`, construirContenidoTXT());
    }

    /**
     * Rellena el formulario con el contenido de un .txt (tabulador, o ';' / ',' como alternativa).
     * También lo usa el asistente de IA (PFM.page.importText).
     * @param {string} texto contenido completo del archivo.
     */
    function aplicarContenidoTXT(texto) {
        PFM.fileIO.contentLines(texto, 'NECESIDADES_PRIORIDADES').forEach(linea => {
            // 3 campos mínimos (id, criterio, peso); con menos se reintenta separando por ; o ,
            const campos = PFM.fileIO.splitFields(linea, 3);
            if (campos.length < 3) return;

            // Ignora filas con id no numérico o fuera de 1..NUM_CRITERIOS
            const id = parseInt(campos[0], 10);
            if (!id || id < 1 || id > NUM_CRITERIOS) return;

            criterioEl(id).value = (campos[1] || '').trim();
            pesoEl(id).value = (campos[2] || '').trim();
        });
        // Persiste de inmediato lo importado
        saveData();
    }

    document.addEventListener('DOMContentLoaded', function () {
        loadSavedData();
        PFM.page.init({ page: 'necesidades.html', save: saveData, onLanguageChange: mostrarAvisoPesos });
        mostrarAvisoPesos();
        // Aviso en vivo mientras el usuario edita los pesos
        for (let i = 1; i <= NUM_CRITERIOS; i++) pesoEl(i).addEventListener('input', mostrarAvisoPesos);

        document.getElementById('guardarNecesidadesBtn')
            .addEventListener('click', guardarNecesidadesTXT);

        // El botón visible "Cargar" abre el <input type=file> oculto; al elegir archivo
        // readSelectedFile lo lee como texto y llama a aplicarContenidoTXT
        const cargarBtn = document.getElementById('cargarNecesidadesBtn');
        const cargarInput = document.getElementById('cargarNecesidadesInput');
        cargarBtn.addEventListener('click', () => cargarInput.click());
        cargarInput.addEventListener('change', event =>
            PFM.fileIO.readSelectedFile(event, aplicarContenidoTXT, 'necesidades'));

        PFM.page.importText = aplicarContenidoTXT; // lo usa el asistente de IA
    });
})();
