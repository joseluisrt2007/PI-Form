/**
 * Generador del informe PDF (jsPDF debe estar cargado antes).
 *
 *   const blob = PFM.pdf.generateReport(data);   // data = projectData
 *
 * El informe es una lista ordenada de secciones (js/pdf/sections/*.js). Cada
 * sección declara de qué módulo depende (enabled) y cómo se dibuja (render).
 * PARA AGREGAR UNA SECCIÓN: crea su archivo en sections/, cárgalo en resultados.html
 * y añade su nombre a ORDEN.
 *
 * CONTRATO de cada sección: PFM.pdf.sections.<nombre> = { enabled(modulos) -> boolean, render(ctx) }.
 *   - <nombre> es la clave en camelCase (p. ej. infoProyecto), NO el nombre del archivo
 *     (info-proyecto.js). ORDEN usa estas claves.
 *   - enabled recibe el objeto `modulos` (ver getModulos) y decide si se imprime.
 *   - render recibe ctx (js/pdf/context.js) y dibuja avanzando ctx.y.
 *
 * SALIDA: generateReport devuelve un Blob (application/pdf). Este archivo NO define el
 * nombre del .pdf descargado ni la descarga: eso lo decide quien llama (js/pages/resultados.js).
 * Formato del documento: new jsPDF() = A4 vertical en mm (ver context.js).
 *
 * CÓMO AGREGAR / QUITAR / REORDENAR (paso a paso):
 *   1. Agregar: crea js/pdf/sections/mi-seccion.js con
 *        PFM.pdf.sections.miSeccion = { enabled: modulos => ..., render(ctx) { ... } };
 *      (copia una existente, p. ej. cierre.js o ideas.js).
 *   2. En resultados.html añade <script src="js/pdf/sections/mi-seccion.js"> DESPUES de
 *      context.js/grupos.js/evaluacion-elementos.js y ANTES de js/pdf/report.js.
 *   3. Añade 'miSeccion' a ORDEN en la posición donde debe salir.
 *   4. Textos: añade las claves a i18n/pdf.js en es Y en.
 *   5. Quitar: borra el nombre de ORDEN (el archivo puede quedarse cargado sin efecto).
 *      CUIDADO: si la quitas, las secciones siguientes se renumeran solas (sectionTitle).
 *   6. Reordenar: cambia la posición en ORDEN. CUIDADO con dependencias de orden:
 *      'mejorConcepto' debe ir DESPUES de 'evaluacionConceptos' (lee data.resultado4..6
 *      que esa sección calcula) y 'cierre' debe ir al final (dibuja en la última página).
 *      'infoProyecto' hace addPage() al inicio: la portada queda sola en la página 1.
 */
(function (PFM) {
    'use strict';

    const pdf = PFM.pdf = PFM.pdf || {};

    /**
     * Orden de las secciones en el informe.
     * CONFIGURABLE: añadir, quitar o reordenar nombres aquí cambia el informe. Cada nombre
     * DEBE existir en PFM.pdf.sections, si no, generateReport lanza TypeError
     * (seccion.enabled sobre undefined), porque no hay comprobación.
     * Módulo (clave de modulosSeleccionados) de cada una:
     *   portada, infoProyecto, criterios, cierre ........ siempre
     *   ideas, evaluacionIdeas .......................... definicionIdeas
     *   evaluacionFunciones, planAccion ................. diagrama
     *   exploracion, formacion, conceptosFormados,
     *   evaluacionConceptos, mejorConcepto .............. exploracionConceptos
     *   prevencion ...................................... prevencion
     */
    const ORDEN = [
        'portada',
        'infoProyecto',
        'criterios',
        'ideas',
        'evaluacionIdeas',
        'evaluacionFunciones',
        'planAccion',
        'exploracion',
        'formacion',
        'conceptosFormados',
        'evaluacionConceptos',
        'mejorConcepto',
        'prevencion',
        'cierre'
    ];

    /**
     * Solo se imprimen los módulos que el usuario eligió en descripcion.html
     * (una sección puede estar vacía pero seguir "activa").
     * Devuelve data.modulosSeleccionados (objeto de booleanos: analisisInicial,
     * definicionIdeas, diagrama, exploracionConceptos, prevencion...). Si no existe
     * (proyecto sin pasar por descripcion) usa el valor por defecto de abajo:
     * CONFIGURABLE: ese objeto por defecto decide qué se imprime en un proyecto sin módulos elegidos.
     * Nota: analisisInicial no es consultado por ninguna sección (criterios/portada son siempre visibles).
     */
    function getModulos(data) {
        return data.modulosSeleccionados || { analisisInicial: true, definicionIdeas: false };
    }

    /**
     * Dibuja el informe y devuelve el PDF como Blob.
     * Flujo: crea el doc (A4, mm) -> crea ctx -> recorre ORDEN en orden -> para cada
     * sección, si enabled(modulos) es true llama render(ctx) -> doc.output('blob').
     */
    pdf.generateReport = function (data) {
        const { jsPDF } = window.jspdf;
        // CONFIGURABLE: new jsPDF({ orientation, unit, format }) cambiaría tamaño/orientación.
        // CUIDADO: todos los umbrales (200..280) y coordenadas asumen A4 vertical en mm.
        const doc = new jsPDF();
        const ctx = pdf.createContext(doc, data);
        const modulos = getModulos(data);

        ORDEN.forEach(nombre => {
            const seccion = pdf.sections[nombre];
            if (seccion.enabled(modulos)) seccion.render(ctx);
        });

        return doc.output('blob');
    };
})(window.PFM = window.PFM || {});
