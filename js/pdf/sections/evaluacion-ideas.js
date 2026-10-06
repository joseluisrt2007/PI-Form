/**
 * Evaluación inicial de las ideas (módulo definicionIdeas: enabled si modulos.definicionIdeas === true).
 * Contrato: { enabled(modulos), render(ctx) }.
 * Lee: data.elementosAEvaluar filtrado a tipo 'concepto'; el detalle (eval_concepto_<idx>_crit1..5,
 * criterios y pesos) lo imprime PFM.pdf.imprimirEvaluaciones (js/pdf/evaluacion-elementos.js).
 * Textos (i18n/pdf.js): initial_evaluation. La versión para funciones es evaluacion-funciones.js.
 */
(function (PFM) {
    'use strict';
    PFM.pdf = PFM.pdf || {};
    PFM.pdf.sections = PFM.pdf.sections || {};

    PFM.pdf.sections.evaluacionIdeas = {
        enabled: modulos => modulos.definicionIdeas === true,
        render(ctx) {
            // 220 => exige 77 mm libres: evita un título de sección huérfano al final de página
            ctx.ensureSpace(220);
            ctx.sectionTitle(ctx.t('initial_evaluation'));

            // Solo ideas (tipo 'concepto'); las funciones ('tarea') van en evaluacion-funciones.js
            const soloConceptos = (ctx.data.elementosAEvaluar || []).filter(e => e.tipo === 'concepto');
            PFM.pdf.imprimirEvaluaciones(ctx, soloConceptos);
        }
    };
})(window.PFM = window.PFM || {});
