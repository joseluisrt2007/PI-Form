/**
 * Lista de ideas/conceptos iniciales (módulo definicionIdeas: enabled si modulos.definicionIdeas === true).
 * Contrato: { enabled(modulos), render(ctx) }.
 * Lee: data.elementosAEvaluar = [{ tipo, idx, nombre }] (lo escribe seleccionEvaluar.html); NO lee
 * concepto1..5 directamente. Imprime TODOS los elementos (ideas y funciones), con su tipo entre corchetes.
 * Textos (i18n/pdf.js): ideas_concepts.
 */
(function (PFM) {
    'use strict';
    PFM.pdf = PFM.pdf || {};
    PFM.pdf.sections = PFM.pdf.sections || {};

    PFM.pdf.sections.ideas = {
        enabled: modulos => modulos.definicionIdeas === true,
        render(ctx) {
            const { doc, data, t, margen } = ctx;

            // 250 => exige 47 mm libres para empezar la sección (título + primeras líneas)
            ctx.ensureSpace(250);
            ctx.sectionTitle(t('ideas_concepts'));

            (data.elementosAEvaluar || []).forEach((elem, index) => {
                // Línea "1. [concepto] nombre" en x = margen. El tipo ('concepto' | 'tarea') sale tal cual,
                // sin traducir (no pasa por i18n/pdf.js). CUIDADO: sin ajuste de línea.
                doc.text(`${index + 1}. [${elem.tipo}] ${elem.nombre}`, margen, ctx.y);
                // CONFIGURABLE: interlineado (mm) de la lista
                ctx.y += 10;
                ctx.ensureSpace(280);
            });
            // CONFIGURABLE: espacio (mm) al final de la sección
            ctx.y += 10;
        }
    };
})(window.PFM = window.PFM || {});
