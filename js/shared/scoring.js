/**
 * ============================================================================
 * shared/scoring.js  ->  PFM.scoring
 * ============================================================================
 * Puntuación ponderada: Σ (calificación 0-10 × peso del criterio).
 * Los pesos (peso1..5) y nombres (criterio1..5) se definen en necesidades.html.
 *
 * API PÚBLICA (PFM.scoring):
 *   NUM_CRITERIOS               -> 5
 *   peso(data, n)               -> number   peso del criterio n (0 si vacío/no numérico)
 *   nombreCriterio(data, n)     -> string   nombre del criterio n o "Necesidad n" / "Need n" (traducido)
 *   total(data, califs)         -> number   suma ponderada de 5 calificaciones
 *   (`data` = resultado de PFM.storage.load(); `n` va de 1 a 5)
 *
 * USADO POR: pages/evaluacion.js y pages/evalConceptos.js (y las secciones de PDF que
 *   recalculen puntuaciones).
 * DEPENDE DE: PFM.i18n (clave 'criteria'); cargar después de core/i18n.js.
 * localStorage (vía `data`): lee criterio1..5 y peso1..5 (los escribe necesidades.html).
 * ============================================================================
 */
(function (PFM) {
    'use strict';

    // CONFIGURABLE: nº de criterios. Está duplicado como constante local en
    // js/pages/necesidades.js y descripcion.js (numCriterios = 5) y fijado en los HTML
    // (filas de necesidades.html, columnas de evaluacion/evalConceptos) y en
    // buildContext de js/features/assistant.js. Cambiarlo exige tocar todos esos sitios
    // y el prompt del asistente (api/assistant.js dice "criterio del 1 al 5").
    const NUM_CRITERIOS = 5;

    /**
     * Peso numérico de un criterio.
     * @param {Object} data       projectData.
     * @param {number} criterio   Número de criterio (1..5).
     * @returns {number} parseFloat de data.peso{n}; 0 si está vacío o no es número.
     */
    function peso(data, criterio) {
        return parseFloat(data[`peso${criterio}`]) || 0;
    }

    /**
     * Nombre del criterio, o "<criteria> N" traducido si está vacío (en es: "Necesidad N"; en en: "Need N").
     * @param {Object} data       projectData.
     * @param {number} criterio   Número de criterio (1..5).
     * @returns {string} El texto escrito por el usuario, o `<traducción de 'criteria'> N`.
     */
    function nombreCriterio(data, criterio) {
        return data[`criterio${criterio}`] || `${PFM.i18n.t('criteria')} ${criterio}`;
    }

    /**
     * Suma ponderada. `califs` es un arreglo de 5 valores (texto o número).
     * @param {Object} data                 projectData (para leer los pesos).
     * @param {Array<string|number>} califs Calificaciones 0-10; califs[0] corresponde al criterio 1.
     *                                      Valores vacíos o no numéricos cuentan como 0.
     * @returns {number} Σ calif_i × peso_i. Con pesos que suman 10 el máximo es 100.
     *          El rango 0-10 de las calificaciones NO se valida aquí (lo valida la página).
     */
    function total(data, califs) {
        let suma = 0;
        for (let i = 1; i <= NUM_CRITERIOS; i++) {
            // califs es base 0 (califs[i - 1]); los criterios/pesos son base 1.
            suma += (parseFloat(califs[i - 1]) || 0) * peso(data, i);
        }
        return suma;
    }

    PFM.scoring = { NUM_CRITERIOS, peso, nombreCriterio, total };
})(window.PFM = window.PFM || {});
