/**
 * Exploración de opciones: las posibilidades de morfología de cada idea (módulo exploracionConceptos:
 * enabled si modulos.exploracionConceptos === true). Contrato: { enabled(modulos), render(ctx) }.
 * Lee: data.pos_<tipo>_<idx>_1..N (escritas por morfologia.html), data.concepto<idx> y la lista de
 * ideas de PFM.pdf.grupos.conceptosExistentes. Textos (i18n/pdf.js): explore_possibilities, idea, for, options.
 *
 * Los elementos ({tipo, idx, nombre}) son los mismos que ven morfologia.html y gc1.html (ideas y funciones).
 */
(function (PFM) {
    'use strict';
    PFM.pdf = PFM.pdf || {};
    PFM.pdf.sections = PFM.pdf.sections || {};

    PFM.pdf.sections.exploracion = {
        enabled: modulos => modulos.exploracionConceptos === true,
        render(ctx) {
            const { doc, data, t, margen } = ctx;

            // 200 => exige 97 mm libres (el umbral más estricto): evita título huérfano
            ctx.ensureSpace(200);
            ctx.sectionTitle(t('explore_possibilities'));

            PFM.pdf.grupos.conceptosExistentes(data).forEach(elem => {
                // 250 => exige 47 mm libres para empezar cada idea (título + opciones)
                ctx.ensureSpace(250);

                // Nombre a mostrar: nombre guardado > texto de la idea > "Idea <idx>"
                const nombreElem = elem.nombre || data[`concepto${elem.idx}`] || `${t('idea')} ${elem.idx}`;
                // "Para <nombre>" en 14 pt azul oscuro; luego texto normal 12 pt
                ctx.itemTitle(`${t('for')} ${nombreElem}`);
                ctx.bodyStyle();

                // CONFIGURABLE: nº de filas leídas = ctx.NUM_OPCIONES_POR_CONCEPTO (context.js, 3); solo se imprimen las no vacías
                for (let row = 1; row <= ctx.NUM_OPCIONES_POR_CONCEPTO; row++) {
                    const posibilidad = data[`pos_${elem.tipo}_${elem.idx}_${row}`] || '';
                    if (posibilidad && posibilidad.trim()) {
                        // x = margen + 10 (sangría 10 mm); y = cursor. "Opción N: texto" (N = número de fila)
                        doc.text(`  ${t('options')} ${row}: ${posibilidad}`, margen + 10, ctx.y);
                        // CONFIGURABLE: interlineado (mm) entre opciones
                        ctx.y += 8;
                        ctx.ensureSpace(280);
                    }
                }
                // CONFIGURABLE: espacio (mm) entre ideas
                ctx.y += 10;
            });
            // CONFIGURABLE: espacio (mm) al final de la sección
            ctx.y += 10;
        }
    };
})(window.PFM = window.PFM || {});
