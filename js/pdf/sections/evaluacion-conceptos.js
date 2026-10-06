/**
 * Evaluación de los 3 conceptos formados: puntuación final de cada uno (módulo exploracionConceptos:
 * enabled si modulos.exploracionConceptos === true). Contrato: { enabled(modulos), render(ctx) }.
 * Lee: data.ca1..ca15 (calificaciones de evalConceptos.html: concepto c usa ca[(c-1)*5+1 .. c*5]) y los
 * pesos (PFM.scoring.peso). ESCRIBE en memoria data.resultado4..6 (no en localStorage) para mejor-concepto.js.
 * Textos (i18n/pdf.js): evaluation_concepts_formed, concept_formed, final_score.
 * CUIDADO: debe ir antes de 'mejorConcepto' en ORDEN (report.js).
 */
(function (PFM) {
    'use strict';
    PFM.pdf = PFM.pdf || {};
    PFM.pdf.sections = PFM.pdf.sections || {};

    PFM.pdf.sections.evaluacionConceptos = {
        enabled: modulos => modulos.exploracionConceptos === true,
        render(ctx) {
            const { doc, data, t, margen, NUM_CRITERIOS } = ctx;

            // 220 => exige 77 mm libres antes de abrir la sección
            ctx.ensureSpace(220);
            ctx.sectionTitle(t('evaluation_concepts_formed'));

            // Un concepto formado por vuelta (1..ctx.NUM_CONCEPTOS_FORMADOS = 3)
            for (let conc = 1; conc <= ctx.NUM_CONCEPTOS_FORMADOS; conc++) {
                let tieneDatos = false;
                let total = 0;
                for (let i = 1; i <= NUM_CRITERIOS; i++) {
                    // Índice global de la calificación: 5 criterios por concepto (ca1..5, ca6..10, ca11..15)
                    const califVal = data[`ca${(conc - 1) * NUM_CRITERIOS + i}`];
                    if (califVal && califVal !== '') {
                        const calif = parseFloat(califVal) || 0;
                        if (calif > 0) tieneDatos = true;
                        total += calif * PFM.scoring.peso(data, i);
                    }
                }
                // Sin ninguna calificación > 0 el concepto no se imprime ni se guarda resultado
                if (!tieneDatos) continue;

                // 260 => exige 37 mm libres (título + línea de puntuación)
                ctx.ensureSpace(260);
                ctx.itemTitle(`${t('concept_formed')} ${conc}`);
                ctx.bodyStyle();

                // "Puntuación final: NN.NN" en x = margen + 10; CONFIGURABLE: toFixed(2) = decimales; 12 mm = espacio tras la línea
                doc.text(`${t('final_score')}: ${total.toFixed(2)}`, margen + 10, ctx.y);
                ctx.y += 12;

                // La sección "mejor concepto" (siguiente) lee este valor (string con 2 decimales; resultado4 = concepto 1)
                data[`resultado${conc + 3}`] = total.toFixed(2);
            }
            // CONFIGURABLE: espacio (mm) al final de la sección
            ctx.y += 15;
        }
    };
})(window.PFM = window.PFM || {});
