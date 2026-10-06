/**
 * Plan de acción: tabla Entrada / Función / Salida del diagrama (módulo diagrama: enabled si
 * modulos.diagrama === true). Contrato: { enabled(modulos), render(ctx) }.
 * Lee: data.persona1..30 (entrada), data.tarea1..30 (función), data.salida1..30 (salida), escritas
 * por diagrama.html. Textos (i18n/pdf.js): action_plan.
 * Es una tabla SIN líneas ni encabezados: solo texto en 4 columnas de x fijas.
 */
(function (PFM) {
    'use strict';
    PFM.pdf = PFM.pdf || {};
    PFM.pdf.sections = PFM.pdf.sections || {};

    PFM.pdf.sections.planAccion = {
        enabled: modulos => modulos.diagrama === true,
        render(ctx) {
            const { doc, data, t, margen } = ctx;

            // 230 => exige 67 mm libres antes de abrir la sección
            ctx.ensureSpace(230);
            ctx.sectionTitle(t('action_plan'));

            // CONFIGURABLE: 11 pt (un punto menos que el texto base) para que quepan las 3 columnas
            ctx.style({ size: 11, font: 'normal', color: ctx.colores.negro });

            // Posición de cada columna (mm). CONFIGURABLE: espacioCol = ancho de cada columna de texto
            // (32 * 2 = 64 mm); con margen 20: números x=20, entrada x=30, función x=94, salida x=158.
            // CUIDADO: sin ajuste de línea, y la salida empieza en x=158 (quedan 52 mm hasta el borde):
            // un texto de más de ~25 caracteres a 11 pt se sale de la página.
            const espacioCol = 32 * 2;
            const col1 = margen;              // número
            const col2 = col1 + 10;           // entrada
            const col3 = col2 + espacioCol;   // función
            const col4 = col3 + espacioCol;   // salida

            // filaNum numera solo las filas impresas (las vacías no dejan hueco); 30 = máximo de filas del diagrama
            let filaNum = 1;
            for (let i = 1; i <= 30; i++) {
                const persona = data[`persona${i}`] || '';
                const tarea = data[`tarea${i}`] || '';
                const salida = data[`salida${i}`] || '';

                if (persona.trim() || tarea.trim() || salida.trim()) {
                    // 270 => por fila; deja 27 mm libres al pie (la fila no se corta)
                    ctx.ensureSpace(270);

                    doc.text(`${filaNum}.`, col1, ctx.y);
                    doc.text(persona, col2, ctx.y);
                    doc.text(tarea, col3, ctx.y);
                    doc.text(salida, col4, ctx.y);

                    // CONFIGURABLE: altura de fila (mm) de la tabla
                    ctx.y += 8;
                    filaNum++;
                }
            }
            // CONFIGURABLE: espacio (mm) al final de la sección
            ctx.y += 10;
        }
    };
})(window.PFM = window.PFM || {});
