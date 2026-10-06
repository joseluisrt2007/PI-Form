/**
 * Pie del documento con la fecha de generación (siempre). Debe ir ÚLTIMA en ORDEN (report.js):
 * dibuja solo en la última página existente. Contrato: { enabled(modulos), render(ctx) }.
 * No lee projectData. Textos (i18n/pdf.js): document_generated; fecha = ctx.hoy.
 */
(function (PFM) {
    'use strict';
    PFM.pdf = PFM.pdf || {};
    PFM.pdf.sections = PFM.pdf.sections || {};

    PFM.pdf.sections.cierre = {
        enabled: () => true,
        render(ctx) {
            // Posición vertical: alto de página (297 mm) - 20 = 277 mm. CONFIGURABLE: cambia 20 para subir/bajar el pie.
            // CUIDADO: no hace ensureSpace; si el contenido llegó hasta ~277 mm, el pie se solapa con él.
            const finalY = ctx.doc.internal.pageSize.height - 20;
            // Pie en 10 pt gris, centrado horizontalmente (x = 105 mm, align 'center')
            ctx.style({ size: 10, color: ctx.colores.gris });
            ctx.doc.text(`${ctx.t('document_generated')} ${ctx.hoy}`, ctx.anchoPagina / 2, finalY, { align: 'center' });
        }
    };
})(window.PFM = window.PFM || {});
