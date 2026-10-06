/**
 * Prevención de riesgos (módulo prevencion: enabled si modulos.prevencion === true).
 * Contrato: { enabled(modulos), render(ctx) }.
 * Se imprimen todas las tablas que el usuario creó (data.numeroPrevenciones, escrito por prevenir.html);
 * si ese dato falta (proyectos antiguos) se usan MAX_TABLAS_EN_INFORME (3) tablas.
 * Lee por tabla i: fallaPotencial, efecto, sev, ocu, riesgo, accionReal, responsable, fechaCell,
 * accionTom, fecha (escritos por prevenir.html). Textos (i18n/pdf.js): risk_prevention, prevention,
 * potential_failure, effect, severity, occurrence, risk, actions_to_take, responsible, today_date,
 * action_taken, action_date (llevan "• " y ":" incluidos en el texto).
 */
(function (PFM) {
    'use strict';
    PFM.pdf = PFM.pdf || {};
    PFM.pdf.sections = PFM.pdf.sections || {};

    // CONFIGURABLE: nº de tablas que se imprimen SOLO si projectData no trae numeroPrevenciones
    // (proyectos guardados con versiones antiguas). Las tablas vacías siempre se omiten.
    const MAX_TABLAS_EN_INFORME = 3;

    /** true si el valor (texto o número) es un número mayor que 0. */
    const esPositivo = v => v && v.toString().trim() && parseFloat(v) > 0;
    /** true si el valor es un texto no vacío (CUIDADO: falla si no es string, p. ej. un número). */
    const hayTexto = v => v && v.trim();

    PFM.pdf.sections.prevencion = {
        enabled: modulos => modulos.prevencion === true,
        render(ctx) {
            const { doc, data, t, margen } = ctx;

            // 220 => exige 77 mm libres antes de abrir la sección
            ctx.ensureSpace(220);
            ctx.sectionTitle(t('risk_prevention'));

            // Nº de tablas creadas en prevenir.html; mínimo 1 y valor de respaldo si el dato falta
            const numTablas = parseInt(data.numeroPrevenciones, 10) || MAX_TABLAS_EN_INFORME;
            for (let i = 1; i <= numTablas; i++) {
                const falla = data[`fallaPotencial${i}`];
                const efecto = data[`efecto${i}`];
                const sev = data[`sev${i}`];
                const ocu = data[`ocu${i}`];
                const riesgo = data[`riesgo${i}`];
                const accionReal = data[`accionReal${i}`];
                const responsable = data[`responsable${i}`];
                const fechaCell = data[`fechaCell${i}`];
                const accionTom = data[`accionTom${i}`];
                const fecha = data[`fecha${i}`];

                // La tabla se imprime solo si al menos un campo tiene contenido
                const tieneDatos = hayTexto(falla) || hayTexto(efecto) || esPositivo(sev) ||
                    esPositivo(ocu) || esPositivo(riesgo) || hayTexto(accionReal) ||
                    hayTexto(responsable) || hayTexto(fechaCell) || hayTexto(accionTom) || hayTexto(fecha);
                if (!tieneDatos) continue;

                // 240 => exige 57 mm libres para empezar una tabla (título + primeras líneas)
                ctx.ensureSpace(240);
                // "PREVENCIÓN N" en 14 pt azul oscuro; luego texto normal 12 pt
                ctx.itemTitle(`${t('prevention')} ${i}`);
                ctx.bodyStyle();

                // Imprime "<etiqueta traducida> <valor>" en x = margen + 10 y baja el cursor.
                // CONFIGURABLE: 10 = interlineado (mm). Sin salto de página entre líneas (solo antes y después de la tabla).
                const linea = (etiqueta, valor) => {
                    doc.text(`${t(etiqueta)} ${valor}`, margen + 10, ctx.y);
                    ctx.y += 10;
                };
                // Orden de las líneas = orden de estas llamadas; reordénalas o quita alguna para cambiar la tabla.
                // Solo se imprimen los campos con contenido (numéricos solo si > 0).
                if (hayTexto(falla)) linea('potential_failure', falla);
                if (hayTexto(efecto)) linea('effect', efecto);
                if (esPositivo(sev)) linea('severity', sev);
                if (esPositivo(ocu)) linea('occurrence', ocu);
                if (esPositivo(riesgo)) linea('risk', riesgo);
                if (hayTexto(accionReal)) linea('actions_to_take', accionReal);
                if (hayTexto(responsable)) linea('responsible', responsable);
                if (hayTexto(fechaCell)) linea('today_date', fechaCell);
                if (hayTexto(accionTom)) linea('action_taken', accionTom);
                if (hayTexto(fecha)) linea('action_date', fecha);

                // CONFIGURABLE: espacio (mm) entre tablas
                ctx.y += 10;
                ctx.ensureSpace(280);
            }
            // CONFIGURABLE: espacio (mm) al final de la sección
            ctx.y += 15;
        }
    };
})(window.PFM = window.PFM || {});
