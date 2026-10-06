/**
 * ============================================================================
 * core/page.js  ->  PFM.page
 * ============================================================================
 * Arranque común de las páginas del flujo.
 *
 * Cada página llama a PFM.page.init({...}) una vez que su DOM está listo:
 *   - conecta el selector de idioma (#languageSelector)
 *   - conecta el botón de tema (#themeToggle)
 *   - muestra el nombre del proyecto en el encabezado (#projectNameText)
 *   - conecta los botones Guardar / Continuar / Regreso (#guardarBtn, #continuarBtn, #anteriorBtn)
 *
 * Opciones:
 *   page              nombre del archivo actual, p. ej. 'ideas.html' (para calcular siguiente/anterior)
 *   save()            función que guarda los datos de la página (se usa en Guardar y Continuar)
 *   onLanguageChange  se llama después de cambiar de idioma (para volver a pintar tablas dinámicas)
 *   getProjectName()  de dónde sale el nombre mostrado (por defecto, el guardado en projectData)
 *
 * Devuelve { updateProjectName } por si la página necesita refrescar el encabezado.
 *
 * Requiere: core/i18n.js, core/storage.js, core/theme.js y core/flow.js.
 *
 * API PÚBLICA (PFM.page):
 *   init(options)     -> { updateProjectName }   ver arriba
 *   navigate(url)     -> void                    cambia de página (window.location.href)
 *   importText        -> null | function(string) punto de enganche que rellena el formulario
 *                        con el texto de un .txt; lo asigna cada página que lo soporta
 *                        (ideas, necesidades, evaluacion) y lo invoca js/features/assistant.js.
 *
 * IDs DEL DOM esperados (todos opcionales: si falta alguno simplemente no se conecta):
 *   #languageSelector  <select> de idioma        (todas las páginas, incluida index.html)
 *   #themeToggle       botón de tema             (todas las páginas, incluida index.html)
 *   #projectNameText   texto del encabezado      (todas salvo index.html)
 *   #guardarBtn / #continuarBtn / #anteriorBtn   (todas las páginas del flujo salvo index
 *                                                 y resultados)
 *
 * localStorage: lee projectData.projectName (vía PFM.storage) solo para el encabezado.
 * ============================================================================
 */
(function (PFM) {
    'use strict';

    /**
     * Va a otra página del proyecto.
     * @param {string} url  Ruta relativa, p. ej. 'ideas.html'.
     */
    function navigate(url) {
        window.location.href = url;
    }

    /**
     * Inicializa idioma, tema, encabezado y botones de navegación de la página.
     * @param {Object} [options]
     * @param {string} [options.page]              Archivo actual (p. ej. 'ideas.html'). Sin él NO se
     *                                             conectan Continuar ni Regreso.
     * @param {function():void} [options.save]     Guarda los datos de la página.
     * @param {function():void} [options.onLanguageChange]  Se llama tras cambiar el idioma.
     * @param {function():string} [options.getProjectName]  Origen del nombre del proyecto.
     * @returns {{updateProjectName: function():void}}
     */
    function init(options) {
        const opts = options || {};
        // Por defecto el nombre sale de projectData.projectName (lo escribe descripcion.html).
        const getProjectName = opts.getProjectName || (() => PFM.storage.load().projectName);

        /** Escribe el nombre del proyecto en #projectNameText (o '(Sin nombre)' traducido). */
        function updateProjectName() {
            const el = document.getElementById('projectNameText');
            if (!el) return;
            const name = getProjectName();
            // Clave i18n 'unnamed_project' se usa si el nombre está vacío o son solo espacios.
            el.textContent = (name && name.trim()) ? name : PFM.i18n.t('unnamed_project');
        }

        // --- Idioma ---
        const langSelector = document.getElementById('languageSelector');
        if (langSelector) {
            // Refleja el idioma actual; los <option value> deben ser códigos de PFM.translations.
            langSelector.value = PFM.i18n.getLang();
            langSelector.addEventListener('change', function () {
                PFM.i18n.setLanguage(this.value);
                // setLanguage ya re-tradujo el DOM estático; aquí se refrescan los textos
                // que se escriben por código.
                updateProjectName();
                PFM.theme.updateButton();
                if (opts.onLanguageChange) opts.onLanguageChange();
            });
        }

        // --- Tema ---
        PFM.theme.init();

        // --- Botones de navegación ---
        // Sin save() proporcionado, Guardar/Continuar no guardan nada (función vacía).
        const save = opts.save || function () {};
        const guardarBtn = document.getElementById('guardarBtn');
        const continuarBtn = document.getElementById('continuarBtn');
        const anteriorBtn = document.getElementById('anteriorBtn');

        if (guardarBtn) guardarBtn.addEventListener('click', save);
        if (opts.page) {
            if (continuarBtn) {
                continuarBtn.addEventListener('click', function () {
                    // Guarda primero y después navega al siguiente paso del flujo activo.
                    // CUIDADO: save() no puede cancelar la navegación (no se mira su retorno);
                    // si una página valida datos, debe hacerlo dentro de su propio manejador.
                    save();
                    navigate(PFM.flow.getNextPage(opts.page));
                });
            }
            if (anteriorBtn) {
                anteriorBtn.addEventListener('click', function () {
                    navigate(PFM.flow.getPreviousPage(opts.page));
                });
            }
        }

        updateProjectName();
        return { updateProjectName };
    }

    /**
     * Registro del importador de texto de la página actual. El asistente de IA
     * llama a PFM.page.importText(contenido) para rellenar el formulario.
     */
    const page = { init, navigate, importText: null };
    PFM.page = page;
})(window.PFM = window.PFM || {});
