/**
 * Criterios y pesos (siempre): lista de los 5 criterios con su peso y la suma total.
 * Módulo: ninguno (enabled siempre true). Contrato: { enabled(modulos), render(ctx) }.
 * Lee: data.criterio1..5 y data.peso1..5 (escritos por necesidades.html; peso vía PFM.scoring.peso).
 * Textos (i18n/pdf.js): criteria_weights, criteria, weight, total_sum_weights.
 * Cantidad de criterios: ctx.NUM_CRITERIOS (PFM.scoring.NUM_CRITERIOS = 5).
 */
(function (PFM) {
    'use strict';
    PFM.pdf = PFM.pdf || {};
    PFM.pdf.sections = PFM.pdf.sections || {};

    PFM.pdf.sections.criterios = {
        enabled: () => true,
        render(ctx) {
            const { doc, data, t, margen } = ctx;

            // Sin ensureSpace propio: sigue a infoProyecto, así que siempre hay sitio
            ctx.sectionTitle(t('criteria_weights'));
            ctx.bodyStyle();

            let sumaPesos = 0;
            for (let i = 1; i <= ctx.NUM_CRITERIOS; i++) {
                // Nombre del criterio o "Criterio N" si está vacío; peso = 0 si vacío/no numérico
                const criterio = data[`criterio${i}`] || `${t('criteria')} ${i}`;
                const peso = PFM.scoring.peso(data, i);
                sumaPesos += peso;

                // Dos columnas en la misma línea: nombre en x = margen; peso en x = margen + 100 (120 mm).
                // CONFIGURABLE: 100 = posición (mm) de la columna Peso; CUIDADO: un nombre largo la pisa.
                doc.text(`${i}. ${criterio}`, margen, ctx.y);
                doc.text(`${t('weight')}: ${peso.toFixed(1)}`, margen + 100, ctx.y);
                // CONFIGURABLE: interlineado (mm) entre criterios
                ctx.y += 10;
                ctx.ensureSpace(280);
            }

            // Suma total en negrita (idealmente 10 si los pesos suman 10; aquí no se valida)
            doc.setFont('helvetica', 'bold');
            doc.text(`${t('total_sum_weights')} ${sumaPesos.toFixed(1)}`, margen, ctx.y);
            // CONFIGURABLE: 15 + 10 = 25 mm de espacio total antes de la siguiente sección
            ctx.y += 15;
            doc.setFont('helvetica', 'normal');
            ctx.y += 10;
        }
    };
})(window.PFM = window.PFM || {});
