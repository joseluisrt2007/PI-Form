/**
 * Portada (siempre): título, nombre del proyecto y fecha, centrados en la página 1.
 * Módulo: ninguno (enabled siempre true). Contrato: { enabled(modulos), render(ctx) }.
 * Lee: data.projectName. Textos (i18n/pdf.js): complete_project_report, generated_on.
 * Posiciones: x = centro de la página (ctx.anchoPagina / 2 = 105 mm), y fijas absolutas en mm.
 * infoProyecto hace addPage() después, así que la portada queda sola en la página 1.
 */
(function (PFM) {
    'use strict';
    PFM.pdf = PFM.pdf || {};
    PFM.pdf.sections = PFM.pdf.sections || {};

    PFM.pdf.sections.portada = {
        enabled: () => true,
        render(ctx) {
            const { doc, data, t } = ctx;

            // Título: 24 pt, azul (colores.titulo), negrita, centrado, baseline a y = 80 mm.
            // CONFIGURABLE: 24 = tamaño; 80 = altura (mm desde arriba) del título.
            ctx.style({ size: 24, color: ctx.colores.titulo, font: 'bold' });
            doc.text(t('complete_project_report'), ctx.anchoPagina / 2, 80, { align: 'center' });

            // Nombre del proyecto: 18 pt negro normal, y = 110 mm (30 mm bajo el título).
            // Texto de respaldo fijo (no pasa por i18n/pdf.js): usa ctx.isSpanish.
            // CUIDADO: sin ajuste de línea; un nombre muy largo se sale del ancho de página (210 mm).
            ctx.style({ size: 18, color: ctx.colores.negro, font: 'normal' });
            doc.text(data.projectName || (ctx.isSpanish ? 'Proyecto sin nombre' : 'Unnamed project'),
                ctx.anchoPagina / 2, 110, { align: 'center' });

            // Fecha de generación: 14 pt gris, y = 130 mm (ctx.hoy, formato según idioma)
            ctx.style({ size: 14, color: ctx.colores.gris });
            doc.text(`${t('generated_on')} ${ctx.hoy}`, ctx.anchoPagina / 2, 130, { align: 'center' });
        }
    };
})(window.PFM = window.PFM || {});
