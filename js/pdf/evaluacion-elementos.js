/**
 * Evaluación ponderada de elementos (ideas o funciones del diagrama): por cada uno,
 * calificación × peso de cada criterio y el total. Se omiten los que no tienen calificaciones.
 *
 * Es una utilidad (PFM.pdf.imprimirEvaluaciones), NO una sección: no tiene enabled/render.
 * La llaman sections/evaluacion-ideas.js (módulo definicionIdeas, elementos tipo 'concepto') y
 * sections/evaluacion-funciones.js (módulo diagrama, tipo 'tarea'), que ya dibujan el título.
 * Claves de projectData: eval_<tipo>_<idx>_crit1..5 (calificación 0-10, escrita por evaluacion.html),
 * criterio1..5 (nombres) y peso1..5 (vía PFM.scoring.peso). Textos: 'criteria' (i18n/pdf.js).
 * Cada elemento recibido es { tipo, idx, nombre } (viene de data.elementosAEvaluar).
 */
(function (PFM) {
    'use strict';
    PFM.pdf = PFM.pdf || {};
    PFM.pdf.sections = PFM.pdf.sections || {};

    /** Imprime la evaluación de cada elemento con al menos una calificación > 0. */
    function imprimirEvaluaciones(ctx, elementos) {
        const { doc, data, t, margen, NUM_CRITERIOS } = ctx;

        elementos.forEach(elem => {
            // CONFIGURABLE: umbral de salto (mm desde arriba). 240 => exige 57 mm libres para
            // empezar un elemento (título + algunas filas); súbelo para saltar de página antes.
            ctx.ensureSpace(240);

            // Primera pasada: ¿hay al menos una calificación numérica > 0? Si no, se omite el elemento

            let tieneDatos = false;
            for (let i = 1; i <= NUM_CRITERIOS; i++) {
                const valor = data[`eval_${elem.tipo}_${elem.idx}_crit${i}`];
                if (valor && valor !== '') {
                    const num = parseFloat(valor);
                    if (!isNaN(num) && num > 0) { tieneDatos = true; break; }
                }
            }
            if (!tieneDatos) return;

            // Nombre del elemento (14 pt azul oscuro, x = margen); luego estilo normal 12 pt
            ctx.itemTitle(`${elem.nombre}`);
            ctx.bodyStyle();

            // Segunda pasada: una línea por criterio con calificación; total = Σ calificación × peso
            let total = 0;
            for (let i = 1; i <= NUM_CRITERIOS; i++) {
                const califVal = data[`eval_${elem.tipo}_${elem.idx}_crit${i}`];
                if (califVal && califVal !== '') {
                    const calif = parseFloat(califVal) || 0;
                    const peso = PFM.scoring.peso(data, i);
                    const ponderado = calif * peso;
                    total += ponderado;
                    // Nombre escrito por el usuario o, si está vacío, "Criterio N"
                    const criterio = data[`criterio${i}`] || `${t('criteria')} ${i}`;
                    // x = margen + 10 (sangría de 10 mm); y = cursor. Formato: calif × peso = ponderado.
                    // CONFIGURABLE: toFixed(1)/toFixed(2) = decimales mostrados; los espacios iniciales
                    // del texto añaden sangría extra.
                    doc.text(`  ${criterio}: ${calif.toFixed(1)} × ${peso.toFixed(1)} = ${ponderado.toFixed(2)}`, margen + 10, ctx.y);
                    // CONFIGURABLE: interlineado entre criterios (mm)
                    ctx.y += 8;
                    // 280 = por línea; deja 17 mm libres al pie
                    ctx.ensureSpace(280);
                }
            }
            // Línea de total en negrita (si hubo salto de página antes, hereda el tamaño 12 pt actual)
            doc.setFont('helvetica', 'bold');
            doc.text(`  TOTAL: ${total.toFixed(2)}`, margen + 10, ctx.y);
            doc.setFont('helvetica', 'normal');
            // CONFIGURABLE: espacio (mm) tras el total, antes del siguiente elemento
            ctx.y += 22;
        });
        // CONFIGURABLE: espacio (mm) al final de la sección
        ctx.y += 10;
    }

    PFM.pdf.imprimirEvaluaciones = imprimirEvaluaciones;
})(window.PFM = window.PFM || {});
