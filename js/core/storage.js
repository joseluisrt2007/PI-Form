/**
 * ============================================================================
 * core/storage.js  ->  PFM.storage
 * ============================================================================
 * Acceso a localStorage. TODO el estado del proyecto vive en una sola clave:
 *   localStorage['projectData']  ->  objeto JSON plano (ver docs/ARQUITECTURA.md
 *                                    para el mapa completo de claves).
 *
 * Patrón de uso en cada página:
 *     const data = PFM.storage.load();
 *     data.algo = 'x';
 *     PFM.storage.save(data);
 *
 * Preferencias de interfaz (fuera de projectData):
 *   'theme' ('light'|'dark') y 'preferredLanguage' ('es'|'en').
 *
 * API PÚBLICA (PFM.storage):
 *   KEY             -> string   nombre de la clave de localStorage ('projectData')
 *   load()          -> object   projectData completo ({} si no existe o está dañado)
 *   save(data)      -> void     sobrescribe projectData con `data` (objeto completo, no parcial)
 *   ensure()        -> void     crea projectData = {} si aún no existe
 *
 * Sin dependencias; debe cargarse antes de flow.js, page.js y de cualquier js/pages/*.
 *
 * CUIDADO: save() REEMPLAZA todo el objeto. Hay que cargar (load), modificar y guardar;
 *   guardar un objeto parcial borraría el resto del proyecto. No hay manejo de
 *   QuotaExceededError (localStorage lleno lanzaría excepción).
 * ============================================================================
 */
(function (PFM) {
    'use strict';

    // CONFIGURABLE: nombre de la clave única de localStorage. NO RENOMBRAR: los proyectos ya
    // guardados en los navegadores de los usuarios quedarían inaccesibles. (Ningún otro
    // archivo debería escribir el literal 'projectData'; todos usan PFM.storage.KEY/load/save.)
    const KEY = 'projectData';

    /**
     * Lee projectData. Si no existe o está dañado devuelve {}.
     * @returns {Object} Datos del proyecto (objeto nuevo en cada llamada; modificarlo no guarda nada).
     */
    function load() {
        try {
            // `|| '{}'` cubre "sin clave"; el `|| {}` final cubre un JSON "null".
            return JSON.parse(localStorage.getItem(KEY) || '{}') || {};
        } catch (e) {
            console.warn('storage: projectData ilegible, se usa un proyecto vacío', e);
            return {};
        }
    }

    /**
     * Guarda el objeto completo como JSON.
     * @param {Object} data  Datos del proyecto (normalmente el resultado de load() ya modificado).
     */
    function save(data) {
        localStorage.setItem(KEY, JSON.stringify(data));
    }

    /** Crea projectData vacío si todavía no existe (se llama desde index). */
    function ensure() {
        if (!localStorage.getItem(KEY)) save({});
    }

    PFM.storage = { KEY, load, save, ensure };
})(window.PFM = window.PFM || {});
