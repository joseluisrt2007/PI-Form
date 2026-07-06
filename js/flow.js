// =============================================
// FLOW.JS — Navegación dinámica entre páginas
// =============================================
// Calcula la página siguiente/anterior según los módulos
// que el usuario seleccionó en descripcion.html, en lugar de
// usar destinos fijos escritos en cada página.
//
// Se apoya en data.modulosSeleccionados:
//   { analisisInicial: true, definicionIdeas: bool, diagrama: bool, exploracionConceptos: bool, prevencion: bool }
//
// Este archivo debe cargarse en cada página del flujo activo,
// ANTES del script propio de esa página.

/**
 * Definición canónica de los pasos del flujo, en orden.
 * 'modulo' puede ser:
 *   - 'siempre'              → siempre activo
 *   - string                 → activo si modulosSeleccionados[string] === true
 *   - function(modulos)      → activo si la función devuelve true (para condiciones compuestas)
 */
const FLOW_STEPS = [
    { page: 'descripcion.html',       modulo: 'siempre' },
    { page: 'necesidades.html',       modulo: 'siempre' },
    { page: 'ideas.html',             modulo: 'definicionIdeas' },
    { page: 'diagrama.html',          modulo: 'diagrama' },
    // La página de selección aparece si hay al menos un módulo que aporta elementos evaluables
    { page: 'seleccionEvaluar.html',  modulo: m => m.definicionIdeas === true || m.diagrama === true },
    { page: 'evaluacion.html',        modulo: m => m.definicionIdeas === true || m.diagrama === true },
    { page: 'morfologia.html',        modulo: 'exploracionConceptos' },
    { page: 'gc1.html',               modulo: 'exploracionConceptos' },
    { page: 'evalConceptos.html',     modulo: 'exploracionConceptos' },
    { page: 'prevenir.html',          modulo: 'prevencion' },
    { page: 'resultados.html',        modulo: 'siempre' }
];

/**
 * Lee data.modulosSeleccionados desde localStorage.
 * Si no existe todavía (p. ej. el usuario llegó sin pasar por
 * descripcion.html), se asume que solo Análisis Inicial está activo,
 * que es el comportamiento más seguro por defecto.
 */
function getModulosSeleccionados() {
    let data = {};
    try {
        data = JSON.parse(localStorage.getItem('projectData') || '{}');
    } catch (e) {
        console.warn('flow.js: no se pudo leer projectData de localStorage', e);
    }
    return data.modulosSeleccionados || { analisisInicial: true, definicionIdeas: false };
}

/**
 * Indica si un paso del flujo debe incluirse según los módulos activos.
 * Soporta tres formas de 'modulo':
 *   - 'siempre'         → siempre activo
 *   - string            → activo si modulosSeleccionados[string] === true
 *   - function(modulos) → activo si la función devuelve true
 */
function pasoActivo(step, modulosSeleccionados) {
    if (step.modulo === 'siempre') return true;
    if (typeof step.modulo === 'function') return step.modulo(modulosSeleccionados);
    return modulosSeleccionados[step.modulo] === true;
}

/**
 * Devuelve la lista de páginas del flujo activo, en orden,
 * filtrando los pasos cuyo módulo no fue seleccionado.
 */
function getFlowActivo() {
    const modulosSeleccionados = getModulosSeleccionados();
    return FLOW_STEPS
        .filter(step => pasoActivo(step, modulosSeleccionados))
        .map(step => step.page);
}

/**
 * Devuelve la página siguiente a currentPage dentro del flujo activo.
 * Si currentPage es la última, o no se encuentra, devuelve 'resultados.html'
 * como destino seguro de respaldo.
 */
function getNextPage(currentPage) {
    const flujo = getFlowActivo();
    const idx = flujo.indexOf(currentPage);

    if (idx === -1) {
        console.warn(`flow.js: "${currentPage}" no está en el flujo activo, usando resultados.html como respaldo`);
        return 'resultados.html';
    }

    if (idx === flujo.length - 1) {
        return 'resultados.html';
    }

    return flujo[idx + 1];
}

/**
 * Devuelve la página anterior a currentPage dentro del flujo activo.
 * Si currentPage es la primera, o no se encuentra, devuelve 'index.html'
 * como destino seguro de respaldo.
 */
function getPreviousPage(currentPage) {
    const flujo = getFlowActivo();
    const idx = flujo.indexOf(currentPage);

    if (idx <= 0) {
        return 'index.html';
    }

    return flujo[idx - 1];
}

// ========== EXPORTAR FUNCIONES PARA USO GLOBAL ==========
window.getNextPage = getNextPage;
window.getPreviousPage = getPreviousPage;
window.getFlowActivo = getFlowActivo;
window.getModulosSeleccionados = getModulosSeleccionados;
