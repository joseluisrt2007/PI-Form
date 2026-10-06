/**
 * Formación de conceptos: resumen de las opciones elegidas en gc1, agrupadas por concepto formado
 * (módulo exploracionConceptos: enabled si modulos.exploracionConceptos === true).
 * Contrato: { enabled(modulos), render(ctx) }. Datos: PFM.pdf.grupos.generarGruposDinamicos(data)
 * (claves fila_grupo_<tipo>_<idx>_col1..3). Textos (i18n/pdf.js): concept_formation,
 * checkbox_selections, selection_summary, concept_formed.
 */
(function (PFM) {
    'use strict';
    PFM.pdf = PFM.pdf || {};
    PFM.pdf.sections = PFM.pdf.sections || {};

    PFM.pdf.sections.formacion = {
        enabled: modulos => modulos.exploracionConceptos === true,
        render(ctx) {
            const { doc, data, t, margen } = ctx;

            // 200 => exige 97 mm libres antes de abrir la sección
            ctx.ensureSpace(200);
            ctx.sectionTitle(t('concept_formation'));

            // Leyenda en gris oscuro (colores.grisOscuro), 12 pt, x = margen; CONFIGURABLE: 10 mm de espacio tras ella
            ctx.style({ size: 12, color: ctx.colores.grisOscuro });
            doc.text(t('checkbox_selections'), margen, ctx.y);
            ctx.y += 10;

            const grupos = PFM.pdf.grupos.generarGruposDinamicos(data);
            // Subtítulo en negro 12 pt (hereda la fuente normal)
            ctx.style({ size: 12, color: ctx.colores.negro });
            doc.text(t('selection_summary'), margen, ctx.y);
            ctx.y += 10;

            // Un bloque por concepto formado (1..ctx.NUM_CONCEPTOS_FORMADOS = 3); se omite si no tiene ninguna selección
            for (let col = 1; col <= ctx.NUM_CONCEPTOS_FORMADOS; col++) {
                const gruposCol = grupos[`col${col}`];
                if (!gruposCol.some(g => g.seleccion && g.seleccion.trim())) continue;

                // Subtítulo "Concepto Formado N:" en negrita, x = margen + 10
                doc.setFont('helvetica', 'bold');
                doc.text(`  ${t('concept_formed')} ${col}:`, margen + 10, ctx.y);
                // CONFIGURABLE: espacio (mm) bajo el subtítulo del concepto
                ctx.y += 8;
                doc.setFont('helvetica', 'normal');

                gruposCol.forEach(grupo => {
                    if (grupo.seleccion && grupo.seleccion.trim()) {
                        // "idea: opción elegida" con más sangría (x = margen + 20); solo las ideas con selección
                        doc.text(`    ${grupo.nombreConcepto}: ${grupo.seleccion}`, margen + 20, ctx.y);
                        // CONFIGURABLE: interlineado (mm) entre selecciones
                        ctx.y += 8;
                        ctx.ensureSpace(280);
                    }
                });
                // CONFIGURABLE: espacio (mm) entre conceptos formados
                ctx.y += 5;
            }
            // CONFIGURABLE: espacio (mm) al final de la sección
            ctx.y += 15;
        }
    };
})(window.PFM = window.PFM || {});
