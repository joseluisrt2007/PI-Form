/**
 * Mejor concepto: el de mayor puntuación y su composición (módulo exploracionConceptos: enabled si
 * modulos.exploracionConceptos === true). Contrato: { enabled(modulos), render(ctx) }.
 * Lee: data.resultado4..6 (las calcula en memoria evaluacion-conceptos.js: debe ir antes en ORDEN) y
 * PFM.pdf.grupos.generarGruposDinamicos (fila_grupo_*). Textos (i18n/pdf.js): best_concept_selected,
 * score_obtained, composition_winner, idea_not_selected, no_best_concept_yet.
 */
(function (PFM) {
    'use strict';
    PFM.pdf = PFM.pdf || {};
    PFM.pdf.sections = PFM.pdf.sections || {};

    PFM.pdf.sections.mejorConcepto = {
        enabled: modulos => modulos.exploracionConceptos === true,
        render(ctx) {
            const { doc, data, t, margen } = ctx;

            // 230 => exige 67 mm libres antes de abrir la sección
            ctx.ensureSpace(230);
            ctx.sectionTitle(t('best_concept_selected'));

            // Busca el máximo entre resultado4..6 (conceptos formados 1..3); en empate gana el primero (> estricto).
            // CUIDADO: rango 4..6 fijo; mejorIndice = i - 3 es el nº de concepto (1..3) y a la vez la columna col<N>.
            let mejorIndice = -1;
            let mejorPuntuacion = -1;
            for (let i = 4; i <= 6; i++) {
                const puntuacion = parseFloat(data[`resultado${i}`]) || 0;
                if (puntuacion > mejorPuntuacion) {
                    mejorPuntuacion = puntuacion;
                    mejorIndice = i - 3;
                }
            }

            if (mejorIndice > 0 && mejorPuntuacion > 0) {
                // Puntuación: 14 pt negro normal, x = margen; CONFIGURABLE: 12 mm de espacio tras cada línea
                ctx.style({ size: 14, color: ctx.colores.negro, font: 'normal' });
                doc.text(`${t('score_obtained')}: ${mejorPuntuacion.toFixed(2)}`, margen, ctx.y);
                ctx.y += 12;

                // Encabezado "COMPOSICIÓN DEL CONCEPTO GANADOR:" en 14 pt azul (colores.titulo) negrita
                ctx.style({ size: 14, color: ctx.colores.titulo, font: 'bold' });
                doc.text(t('composition_winner'), margen, ctx.y);
                ctx.y += 12;

                const grupos = PFM.pdf.grupos.generarGruposDinamicos(data);
                // Ideas de la columna ganadora y la opción elegida en cada una
                const gruposMejor = grupos[`col${mejorIndice}`];

                ctx.bodyStyle();
                gruposMejor.forEach((grupo, index) => {
                    // 270 => por línea; deja 27 mm libres al pie
                    ctx.ensureSpace(270);
                    const texto = (grupo.seleccion && grupo.seleccion.trim())
                        ? `${index + 1}. ${grupo.nombreConcepto}: ${grupo.seleccion}`
                        : `${index + 1}. ${grupo.nombreConcepto}: ${t('idea_not_selected')}`;
                    // x = margen + 10 (sangría 10 mm). CONFIGURABLE: interlineado (mm)
                    doc.text(texto, margen + 10, ctx.y);
                    ctx.y += 10;
                });
            } else {
                // Sin puntuaciones > 0: mensaje en gris 12 pt (ninguna evaluación de conceptos con datos)
                ctx.style({ size: 12, color: ctx.colores.gris, font: 'normal' });
                doc.text(t('no_best_concept_yet'), margen, ctx.y);
                ctx.y += 12;
            }
            // CONFIGURABLE: espacio (mm) al final de la sección
            ctx.y += 20;
        }
    };
})(window.PFM = window.PFM || {});
