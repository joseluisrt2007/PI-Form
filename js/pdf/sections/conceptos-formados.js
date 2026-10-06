/**
 * Conceptos formados: la composición de cada uno de los 3 (módulo exploracionConceptos: enabled si
 * modulos.exploracionConceptos === true). Contrato: { enabled(modulos), render(ctx) }.
 * Datos: PFM.pdf.grupos.generarGruposDinamicos(data) (claves fila_grupo_<tipo>_<idx>_col1..3 de gc1).
 * Textos (i18n/pdf.js): concepts_formed, concepts_from_selections, concept_formed, no_selection.
 * Difiere de formacion.js en que lista TODAS las ideas numeradas (con "(Sin selección)" si falta).
 */
(function (PFM) {
    'use strict';
    PFM.pdf = PFM.pdf || {};
    PFM.pdf.sections = PFM.pdf.sections || {};

    PFM.pdf.sections.conceptosFormados = {
        enabled: modulos => modulos.exploracionConceptos === true,
        render(ctx) {
            const { doc, data, t, margen } = ctx;

            // 220 => exige 77 mm libres antes de abrir la sección
            ctx.ensureSpace(220);
            ctx.sectionTitle(t('concepts_formed'));

            // Leyenda en gris oscuro 12 pt, x = margen; CONFIGURABLE: 10 mm de espacio tras ella
            ctx.style({ size: 12, color: ctx.colores.grisOscuro });
            doc.text(t('concepts_from_selections'), margen, ctx.y);
            ctx.y += 10;

            const grupos = PFM.pdf.grupos.generarGruposDinamicos(data);
            // Un bloque por concepto formado (1..3); se omite si ninguna idea tiene selección
            for (let col = 1; col <= ctx.NUM_CONCEPTOS_FORMADOS; col++) {
                const gruposCol = grupos[`col${col}`];
                if (!gruposCol.some(g => g.seleccion && g.seleccion.trim())) continue;

                // 240 => exige 57 mm libres para empezar cada concepto (título + varias líneas)
                ctx.ensureSpace(240);
                ctx.itemTitle(`${t('concept_formed')} ${col}`);
                ctx.bodyStyle();

                // Una línea por idea: "N. idea: opción" o "N. idea: (Sin selección)"
                gruposCol.forEach((grupo, index) => {
                    const texto = (grupo.seleccion && grupo.seleccion.trim())
                        ? `${index + 1}. ${grupo.nombreConcepto}: ${grupo.seleccion}`
                        : `${index + 1}. ${grupo.nombreConcepto}: ${t('no_selection')}`;
                    // x = margen + 10 (sangría 10 mm). CONFIGURABLE: interlineado (mm) de la línea siguiente
                    doc.text(texto, margen + 10, ctx.y);
                    ctx.y += 10;
                    ctx.ensureSpace(280);
                });
                // CONFIGURABLE: espacio (mm) entre conceptos formados
                ctx.y += 10;
            }
            // CONFIGURABLE: espacio (mm) al final de la sección
            ctx.y += 15;
        }
    };
})(window.PFM = window.PFM || {});
