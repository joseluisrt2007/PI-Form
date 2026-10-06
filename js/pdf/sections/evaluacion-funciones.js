/**
 * Evaluación de las funciones del diagrama (módulo diagrama: enabled si modulos.diagrama === true;
 * además no imprime nada si no hay funciones seleccionadas). Contrato: { enabled(modulos), render(ctx) }.
 * Lee: data.elementosAEvaluar filtrado a tipo 'tarea'; el detalle lo imprime
 * PFM.pdf.imprimirEvaluaciones (js/pdf/evaluacion-elementos.js, claves eval_tarea_<idx>_crit1..5).
 * Textos (i18n/pdf.js): diagram_evaluation_section.
 */
(function (PFM) {
    'use strict';
    PFM.pdf = PFM.pdf || {};
    PFM.pdf.sections = PFM.pdf.sections || {};

    PFM.pdf.sections.evaluacionFunciones = {
        enabled: modulos => modulos.diagrama === true,
        render(ctx) {
            // Solo funciones (tipo 'tarea'); si no hay ninguna se sale SIN título ni numeración de sección
            const soloTareas = (ctx.data.elementosAEvaluar || []).filter(e => e.tipo === 'tarea');
            if (soloTareas.length === 0) return;

            // 220 => exige 77 mm libres antes de abrir la sección
            ctx.ensureSpace(220);
            ctx.sectionTitle(ctx.t('diagram_evaluation_section'));
            PFM.pdf.imprimirEvaluaciones(ctx, soloTareas);
        }
    };
})(window.PFM = window.PFM || {});
