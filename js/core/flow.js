/**
 * ============================================================================
 * core/flow.js  ->  PFM.flow
 * ============================================================================
 * FLOW — Navegación dinámica entre páginas.
 *
 * Calcula la página siguiente/anterior según los módulos que el usuario
 * eligió en descripcion.html (projectData.modulosSeleccionados):
 *   { analisisInicial: true, definicionIdeas, diagrama, exploracionConceptos, prevencion }
 *
 * PARA AGREGAR UNA PÁGINA AL FLUJO: añade una fila a FLOW_STEPS en el
 * orden en que debe aparecer.
 *
 * API PÚBLICA (PFM.flow):
 *   FLOW_STEPS                          -> Array<{page, modulo}>  tabla completa (solo lectura)
 *   getModulosSeleccionados()           -> object   módulos elegidos (con valor por defecto)
 *   getFlowActivo()                     -> string[] nombres de archivo de las páginas activas, en orden
 *   getNextPage(currentPage)            -> string   página siguiente ('resultados.html' de respaldo)
 *   getPreviousPage(currentPage)        -> string   página anterior ('index.html' de respaldo)
 *
 * QUIÉN LO USA: core/page.js (botones Continuar / Regreso) y las páginas que
 *   necesiten saber qué módulos están activos.
 *
 * DEPENDE DE: PFM.storage (core/storage.js). Orden de carga: después de storage.js.
 *
 * localStorage: lee (vía PFM.storage.load) projectData.modulosSeleccionados, que escribe
 *   descripcion.html. No escribe nada.
 *
 * CUIDADO: los nombres de 'page' deben coincidir EXACTAMENTE con el nombre del archivo
 *   HTML, y con el `page:` que cada página pasa a PFM.page.init(); si no coinciden
 *   getNextPage usa el respaldo y el usuario salta a resultados.html.
 * ============================================================================
 */
(function (PFM) {
    'use strict';

    /**
     * Pasos del flujo, en orden. `modulo` puede ser:
     *   - 'siempre'          -> siempre activo
     *   - string             -> activo si modulosSeleccionados[string] === true
     *   - function(modulos)  -> activo si devuelve true (condiciones compuestas)
     */
    // CONFIGURABLE: esta tabla es el ÚNICO lugar que define el orden de las páginas y qué
    // módulo activa cada una. Al añadir/quitar/reordenar filas, revisa también: el HTML y JS
    // de la página (PFM.page.init({page})), los checkboxes de módulos en descripcion.html/js,
    // y el PDF (js/pdf/report.js, ORDEN) si la página aporta una sección al informe.
    // Los nombres de módulo ('definicionIdeas', 'diagrama', 'exploracionConceptos',
    // 'prevencion') deben coincidir con las claves que guarda descripcion.js.
    const FLOW_STEPS = [
        { page: 'descripcion.html', modulo: 'siempre' },
        { page: 'necesidades.html', modulo: 'siempre' },
        { page: 'ideas.html', modulo: 'definicionIdeas' },
        { page: 'evaluacion.html', modulo: 'definicionIdeas' },
        { page: 'diagrama.html', modulo: 'diagrama' },
        // El usuario elige qué ideas/funciones pasan a morfología, gc1 y evalConceptos.
        // Solo aparece si hay exploración activa Y algún módulo que aporte elementos.
        {
            page: 'seleccionEvaluar.html',
            modulo: m => m.exploracionConceptos === true &&
                         (m.definicionIdeas === true || m.diagrama === true)
        },
        { page: 'morfologia.html', modulo: 'exploracionConceptos' },
        { page: 'gc1.html', modulo: 'exploracionConceptos' },
        { page: 'evalConceptos.html', modulo: 'exploracionConceptos' },
        { page: 'prevenir.html', modulo: 'prevencion' },
        { page: 'resultados.html', modulo: 'siempre' }
    ];

    /**
     * Módulos activos. Si aún no existen (se llegó sin pasar por
     * descripcion.html) se asume solo Análisis Inicial.
     * @returns {Object<string, boolean>} p. ej. { analisisInicial:true, definicionIdeas:false }
     */
    function getModulosSeleccionados() {
        // CONFIGURABLE: módulos por defecto cuando aún no hay selección guardada.
        // Ponerle true a otro módulo aquí lo activaría para quien entre directo a una página.
        return PFM.storage.load().modulosSeleccionados || { analisisInicial: true, definicionIdeas: false };
    }

    /**
     * ¿Está activo este paso del flujo?
     * @param {{page:string, modulo:(string|function)}} step  Fila de FLOW_STEPS.
     * @param {Object<string, boolean>} modulos               Resultado de getModulosSeleccionados().
     * @returns {boolean}
     */
    function pasoActivo(step, modulos) {
        if (step.modulo === 'siempre') return true;
        if (typeof step.modulo === 'function') return step.modulo(modulos);
        // Comparación estricta con true: un valor "truthy" (1, 'si') NO activa el módulo.
        return modulos[step.modulo] === true;
    }

    /**
     * Páginas del flujo activo, en orden.
     * @returns {string[]} p. ej. ['descripcion.html','necesidades.html','resultados.html']
     */
    function getFlowActivo() {
        const modulos = getModulosSeleccionados();
        return FLOW_STEPS.filter(step => pasoActivo(step, modulos)).map(step => step.page);
    }

    /**
     * Página siguiente a currentPage. Respaldo: resultados.html.
     * @param {string} currentPage  Nombre del archivo actual (p. ej. 'ideas.html').
     * @returns {string} Nombre del archivo siguiente.
     */
    function getNextPage(currentPage) {
        const flujo = getFlowActivo();
        const idx = flujo.indexOf(currentPage);

        if (idx === -1) {
            // La página actual no está activa (p. ej. se desactivó su módulo): se salta al final.
            console.warn(`flow: "${currentPage}" no está en el flujo activo, usando resultados.html como respaldo`);
            return 'resultados.html';
        }
        if (idx === flujo.length - 1) return 'resultados.html';
        return flujo[idx + 1];
    }

    /**
     * Página anterior a currentPage. Respaldo: index.html.
     * @param {string} currentPage  Nombre del archivo actual.
     * @returns {string} Nombre del archivo anterior; 'index.html' si es la primera o no está en el flujo.
     */
    function getPreviousPage(currentPage) {
        const flujo = getFlowActivo();
        const idx = flujo.indexOf(currentPage);
        // idx === -1 (no está) o 0 (es la primera): vuelve al menú principal.
        if (idx <= 0) return 'index.html';
        return flujo[idx - 1];
    }

    PFM.flow = { FLOW_STEPS, getNextPage, getPreviousPage, getFlowActivo, getModulosSeleccionados };
})(window.PFM = window.PFM || {});
