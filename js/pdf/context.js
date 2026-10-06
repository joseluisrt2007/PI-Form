/**
 * Contexto de dibujo del informe PDF: agrupa el documento jsPDF, los datos del
 * proyecto, el cursor vertical (y) y los helpers que usan todas las secciones.
 *
 * Cada sección (js/pdf/sections/*.js) recibe este `ctx` y va escribiendo con
 * ctx.doc.text(...) avanzando ctx.y. Estilos: ctx.style({ size, color, font }).
 *
 * UNIDADES (verificado en report.js: `new jsPDF()` sin argumentos):
 *   - Formato por defecto de jsPDF 2.5.1: A4 vertical, unidad = MILÍMETROS (mm).
 *   - Página: 210 mm de ancho x 297 mm de alto (ctx.anchoPagina vale 210).
 *   - TODAS las coordenadas (x, y), márgenes e incrementos de ctx.y son mm.
 *   - Los tamaños de fuente (setFontSize / style({size})) son PUNTOS (pt), no mm.
 *     Ej.: 12 pt ~ 4,2 mm de alto de letra, por eso un salto de 8-10 mm entre
 *     líneas de 12 pt deja un interlineado holgado.
 *   - jsPDF dibuja el texto con y = línea base (la parte inferior de la letra).
 *
 * SALTOS DE PÁGINA: jsPDF NO salta solo. Cada sección llama a ctx.ensureSpace(limite)
 * con un `limite` en mm medido desde el borde SUPERIOR. Como la página mide 297 mm,
 * (297 - limite) es el espacio libre mínimo que se exige. Ver ensureSpace() abajo.
 *
 * CUIDADO: doc.text() NO hace ajuste de línea automático. Un texto largo se sale del
 * borde derecho (210 mm). Solo info-proyecto.js usa doc.splitTextToSize para partir líneas.
 */
(function (PFM) {
    'use strict';

    const pdf = PFM.pdf = PFM.pdf || {};
    pdf.sections = pdf.sections || {};

    // CONFIGURABLE: paleta del informe, cada color es [R, G, B] con valores 0-255.
    // Se consumen vía ctx.colores.<nombre> (ctx.style({ color: ... })).
    const COLORES = {
        titulo: [21, 101, 192],      // título de sección y portada (azul); usado en sectionTitle() y "composición ganador"
        subtitulo: [13, 71, 161],    // título de elemento dentro de una sección (azul más oscuro); usado en itemTitle()
        negro: [0, 0, 0],            // texto de contenido (bodyStyle)
        gris: [100, 100, 100],       // textos secundarios: fecha de portada, pie (cierre), "sin mejor concepto"
        grisOscuro: [80, 80, 80]     // leyendas explicativas bajo el título en formacion.js y conceptos-formados.js
    };

    /**
     * Texto del informe en el idioma actual (textos en i18n/pdf.js).
     * Lee PFM.pdfStrings[idioma][key]; idioma = PFM.i18n.getLang() ('es' | 'en').
     * Si la clave no existe devuelve la propia clave (así un typo se ve en el PDF
     * como texto crudo en vez de romper). Para agregar un texto: añade la clave
     * en AMBOS idiomas de i18n/pdf.js.
     */
    pdf.t = function (key) {
        const table = PFM.pdfStrings[PFM.i18n.getLang()];
        return (table && table[key]) || key;
    };

    /**
     * Crea el contexto compartido por todas las secciones.
     * @param {jsPDF} doc   documento jsPDF (A4, mm) creado en report.js
     * @param {Object} data projectData completo (localStorage['projectData'])
     * @returns {Object} ctx con las propiedades descritas abajo
     */
    pdf.createContext = function (doc, data) {
        const isSpanish = PFM.i18n.getLang() === 'es';

        const ctx = {
            // Instancia jsPDF: las secciones llaman doc.text(), doc.addPage(), etc.
            doc,
            // projectData: las secciones leen claves como data.projectName, data.criterio1...
            // CUIDADO: no es de solo lectura; evaluacion-conceptos.js ESCRIBE data.resultado4..6
            // (en memoria, no en localStorage) para que mejor-concepto.js las lea después.
            data,
            // Función de traducción del PDF (ver pdf.t arriba): ctx.t('clave')
            t: pdf.t,
            // Paleta de colores (ver COLORES arriba)
            colores: COLORES,
            // true si el idioma es español; úsalo para textos que no están en i18n/pdf.js
            isSpanish,
            // Fecha de generación ya formateada ('dd/mm/aaaa' en es-ES, 'm/d/aaaa' en en-US).
            // CONFIGURABLE: cambia los códigos de locale ('es-ES' / 'en-US') para otro formato de fecha.
            hoy: new Date().toLocaleDateString(isSpanish ? 'es-ES' : 'en-US'),
            // CONFIGURABLE: margen izquierdo en mm (x de inicio de casi todo el texto) y
            // también la y con la que empieza cada página nueva (ver ensureSpace/info-proyecto).
            // Nota: solo se aplica a la izquierda/arriba; no hay margen derecho propio, el
            // ancho útil que usa splitTextToSize es anchoPagina - 2 * margen (170 mm).
            margen: 20,
            // Ancho de página en mm (210 en A4). Se usa para centrar (anchoPagina / 2) y
            // para calcular el ancho de los párrafos.
            anchoPagina: doc.internal.pageSize.width,
            // Cursor vertical en mm desde el borde superior: donde se dibujará la próxima línea.
            // Cada sección lo incrementa tras escribir. Empieza en 20 (= margen inicial).
            y: 20,                 // cursor vertical
            // Contador de secciones numeradas; sectionTitle() lo incrementa y antepone "N. ".
            seccionActual: 0,      // contador de secciones numeradas
            // Nº de criterios de evaluación (5, definido en js/shared/scoring.js; debe
            // coincidir con necesidades.html, que escribe criterio1..5 / peso1..5).
            NUM_CRITERIOS: PFM.scoring.NUM_CRITERIOS,
            // Nº de "conceptos formados" (columnas col1..col3 de gc1). Recorre ca1..ca15
            // en evaluacion-conceptos.js (3 conceptos x NUM_CRITERIOS) y resultado4..6.
            // CUIDADO: cambiarlo exige cambiar también la página gc1/evalConceptos y mejor-concepto.js (rango 4..6 fijo).
            NUM_CONCEPTOS_FORMADOS: 3,
            // Nº de filas de opciones de morfología por concepto que se imprimen en exploracion.js
            // (claves pos_<tipo>_<idx>_1..N). CONFIGURABLE: súbelo si la página morfología permite más filas.
            NUM_OPCIONES_POR_CONCEPTO: 3,

            /**
             * Cambia solo las propiedades indicadas: size (pt), color ([r,g,b]) y font ('bold'|'normal').
             * Lo que no se pasa se conserva del estilo anterior (jsPDF es con estado), por eso
             * muchas secciones solo pasan { size, color } y heredan la fuente previa.
             * La familia está fija en 'helvetica' (fuente estándar de jsPDF, sin tildes raras
             * fuera de Latin-1); CONFIGURABLE: cámbiala aquí para todo el informe.
             */
            style({ size, color, font }) {
                if (size !== undefined) doc.setFontSize(size);
                if (color !== undefined) doc.setTextColor(...color);
                if (font !== undefined) doc.setFont('helvetica', font);
            },

            /**
             * Salta de página si el cursor pasó de `limite` (mm desde el borde superior).
             * Se llama ANTES de dibujar un bloque; el umbral es "hasta dónde se tolera
             * que el cursor haya bajado para que el bloque quepa":
             *   - 280: línea suelta dentro de un bucle (297 - 280 = 17 mm libres; evita
             *     escribir sobre el borde inferior). Es el umbral más usado.
             *   - 270/260/250/240: bloques cortos de título + varias líneas (27-57 mm libres).
             *   - 230/220/200: inicio de sección completa (67-97 mm libres) para no dejar
             *     un título huérfano al final de la página.
             * Los valores no están calculados con la altura real del bloque: son heurísticos.
             * Tras saltar, y vuelve a `margen` (20 mm). No repite estilos: ver CUIDADO en style().
             */
            ensureSpace(limite) {
                if (ctx.y > limite) {
                    doc.addPage();
                    ctx.y = ctx.margen;
                }
            },

            /**
             * Título de sección con numeración secuencial: el número solo avanza
             * cuando la sección realmente se imprime, así que nunca hay huecos
             * sin importar qué módulos estén activos.
             * Dibuja en x = margen, y = ctx.y; después baja el cursor 15 mm.
             */
            sectionTitle(textoBase) {
                ctx.seccionActual++;
                // CONFIGURABLE: tamaño (16 pt), color (titulo) y negrita de los títulos de sección
                ctx.style({ size: 16, color: COLORES.titulo, font: 'bold' });
                doc.text(`${ctx.seccionActual}. ${textoBase}`, ctx.margen, ctx.y);
                // CONFIGURABLE: espacio (mm) entre el título de sección y su primer contenido
                ctx.y += 15;
            },

            /** Título de un elemento dentro de una sección (idea, concepto, prevención...). */
            itemTitle(texto) {
                // CONFIGURABLE: tamaño (14 pt), color (subtitulo) y negrita de los títulos de elemento
                ctx.style({ size: 14, color: COLORES.subtitulo, font: 'bold' });
                doc.text(texto, ctx.margen, ctx.y);
                // CONFIGURABLE: espacio (mm) entre el título del elemento y su contenido
                ctx.y += 12;
            },

            /**
             * Estilo normal del texto de contenido.
             * Conviene llamarlo tras sectionTitle()/itemTitle(), que dejan fuente grande y azul.
             */
            bodyStyle() {
                // CONFIGURABLE: tamaño (12 pt), color (negro) y peso del texto base del informe
                ctx.style({ size: 12, color: COLORES.negro, font: 'normal' });
            }
        };
        return ctx;
    };
})(window.PFM = window.PFM || {});
