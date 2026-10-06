/**
 * descripcion.html — Nombre, descripción del proyecto y selección de módulos.
 *
 * Guarda en projectData: projectName, projectDescription, numCriterios,
 * modulosSeleccionados. Los módulos elegidos aquí deciden qué páginas
 * componen el flujo (ver core/flow.js) y qué secciones lleva el PDF.
 *
 * DOM que usa (descripcion.html):
 *   #projectName          <input text> nombre del proyecto
 *   #projectDescription   <textarea> descripción
 *   #mod-definicionIdeas, #mod-diagrama, #mod-exploracionConceptos, #mod-prevencion
 *                         checkboxes de módulos opcionales
 *   #mod-analisisInicial  checkbox marcado y deshabilitado (obligatorio); este JS NO lo lee,
 *                         su valor (true) se fija en leerModulosDesdeUI.
 *   #guardarBtn / #continuarBtn / #anteriorBtn   los conecta PFM.page.init
 *
 * Claves de projectData:
 *   projectName, projectDescription   texto (recortado con trim al guardar)
 *   numCriterios                      número fijo (5), lo consumen otras páginas/PDF
 *   modulosSeleccionados              { analisisInicial:true, definicionIdeas, diagrama,
 *                                       exploracionConceptos, prevencion }  (booleanos)
 *
 * Flujo: al cargar rellena el formulario con lo guardado (y migra datos antiguos);
 * "Guardar" escribe todo en localStorage; "Continuar" guarda y navega a la página que
 * devuelva PFM.flow.getNextPage('descripcion.html') (siempre necesidades.html).
 * Ojo: no hay validación; se puede continuar con el nombre vacío.
 */
(function () {
    'use strict';

    // Copia en memoria de projectData; cada función la modifica y la vuelca con storage.save
    const data = PFM.storage.load();

    // CONFIGURABLE: número de criterios/pesos del proyecto. Se guarda como numCriterios.
    // Si se cambia hay que cambiar a la vez: las 5 filas fijas de necesidades.html y
    // NUM_CRITERIOS en necesidades.js, PFM.scoring.NUM_CRITERIOS (shared/scoring.js), la
    // tabla [1,2,3,4,5] de evaluacion.js, evalConceptos y las secciones PDF.
    // CUIDADO: migrateOldData asume el paso de 4 a 5 criterios con nombres literales.
    const NUM_CRITERIOS = 5;

    // Clave del módulo -> id del checkbox en descripcion.html
    // (analisisInicial es obligatorio y siempre true)
    // CONFIGURABLE: para añadir un módulo nuevo hay que (1) añadir aquí su clave e id de
    // checkbox, (2) crear el checkbox en descripcion.html con ese id, (3) usar la misma clave
    // en FLOW_STEPS (core/flow.js) y en enabled(modulos) de la sección PDF, y (4) añadir
    // los textos i18n de su tarjeta (es.js y en.js). Renombrar una clave rompe los
    // proyectos ya guardados (quedaría como "no seleccionado").
    const MODULOS_OPCIONALES = {
        definicionIdeas: 'mod-definicionIdeas',
        diagrama: 'mod-diagrama',
        exploracionConceptos: 'mod-exploracionConceptos',
        prevencion: 'mod-prevencion'
    };

    /**
     * Lee el estado de los checkboxes.
     * @returns {Object} objeto modulosSeleccionados completo: analisisInicial siempre true
     *   y cada módulo opcional true/false según su checkbox (false si el checkbox no existe).
     */
    function leerModulosDesdeUI() {
        const modulos = { analisisInicial: true };
        Object.keys(MODULOS_OPCIONALES).forEach(key => {
            const checkbox = document.getElementById(MODULOS_OPCIONALES[key]);
            modulos[key] = checkbox ? checkbox.checked : false;
        });
        return modulos;
    }

    /** modulosSeleccionados guardado -> checkboxes (sin datos, quedan sin marcar). */
    function aplicarModulosAUI() {
        const guardados = data.modulosSeleccionados || {};
        Object.keys(MODULOS_OPCIONALES).forEach(key => {
            const checkbox = document.getElementById(MODULOS_OPCIONALES[key]);
            // Comparación estricta: solo el booleano true marca la casilla
            if (checkbox) checkbox.checked = guardados[key] === true;
        });
    }

    /**
     * Guarda los campos del formulario en projectData. Es la función `save` que recibe
     * PFM.page.init (la usan los botones Guardar y Continuar).
     */
    function saveData() {
        data.projectName = document.getElementById('projectName').value.trim();
        data.projectDescription = document.getElementById('projectDescription').value.trim();
        data.numCriterios = NUM_CRITERIOS;
        data.modulosSeleccionados = leerModulosDesdeUI();
        PFM.storage.save(data);
    }

    /**
     * Proyectos guardados con 4 criterios se completan al formato de 5.
     * Solo añade criterio5/peso5 vacíos; no toca nada más. Se ejecuta en memoria
     * (se persistirá la próxima vez que se guarde).
     */
    function migrateOldData() {
        if (data.criterio4 && !data.criterio5) {
            data.criterio5 = '';
            data.peso5 = '';
        }
    }

    /** Rellena el formulario con lo guardado; campos vacíos si no hay datos. */
    function loadSavedData() {
        migrateOldData();
        document.getElementById('projectName').value = data.projectName || '';
        document.getElementById('projectDescription').value = data.projectDescription || '';
        aplicarModulosAUI();
    }

    document.addEventListener('DOMContentLoaded', function () {
        loadSavedData();

        const nameInput = document.getElementById('projectName');
        const header = PFM.page.init({
            page: 'descripcion.html',
            save: saveData,
            // aquí el nombre mostrado sale del campo, no de lo guardado
            getProjectName: () => nameInput.value.trim()
        });

        // Actualiza el "Proyecto: ..." del encabezado en vivo mientras se escribe
        nameInput.addEventListener('input', header.updateProjectName);
    });
})();
