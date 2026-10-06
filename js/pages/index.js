/**
 * Página principal (index.html): menú de inicio.
 *
 * DOM que usa (definido en index.html):
 *   #startBtn         botón "Iniciar" (data-i18n="start"); lleva a descripcion.html
 *   #languageSelector, #themeToggle   los conecta PFM.page.init (no se tocan aquí)
 *
 * projectData: no lee ni escribe ninguna clave de contenido; solo garantiza que
 * exista (PFM.storage.ensure) para que las páginas siguientes puedan cargarlo.
 *
 * Flujo: al cargar el script se asegura projectData -> en DOMContentLoaded se
 * inicializa la cabecera común -> al pulsar "Iniciar" se navega a descripcion.html.
 * Esta página NO tiene botones Guardar/Continuar/Regreso, por eso init se llama
 * sin `page` ni `save`.
 *
 * Scripts requeridos antes (ver index.html): i18n/es.js, i18n/en.js y
 * js/core/{i18n,storage,theme,flow,page}.js.
 */
(function () {
    'use strict';

    // Crea projectData vacío ('{}') si es la primera visita. Se ejecuta de inmediato
    // (no espera a DOMContentLoaded) porque solo toca localStorage, no el DOM.
    // No borra un proyecto existente.
    PFM.storage.ensure();

    document.addEventListener('DOMContentLoaded', function () {
        // Sin opciones: solo idioma, tema y nombre de proyecto en el encabezado.
        // (index.html no tiene #projectNameText, así que el nombre no se muestra.)
        PFM.page.init({});

        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click', function () {
                // CONFIGURABLE: primera página del flujo. Debe coincidir con la primera fila
                // de FLOW_STEPS en js/core/flow.js (descripcion.html).
                PFM.page.navigate('descripcion.html');
            });
        }
    });
})();
