/**
 * Información del proyecto: nombre y descripción (siempre). Empieza en página nueva (página 2).
 * Módulo: ninguno (enabled siempre true). Contrato: { enabled(modulos), render(ctx) }.
 * Lee: data.projectName, data.projectDescription (los escribe descripcion.html).
 * Textos (i18n/pdf.js): project_information, project_name_label, unnamed_project,
 * description_label, no_description.
 * Es la única sección que parte líneas con doc.splitTextToSize (la descripción puede ser larga).
 */
(function (PFM) {
    'use strict';
    PFM.pdf = PFM.pdf || {};
    PFM.pdf.sections = PFM.pdf.sections || {};

    PFM.pdf.sections.infoProyecto = {
        enabled: () => true,
        render(ctx) {
            const { doc, data, t, margen } = ctx;

            // Fuerza página nueva (la portada ocupa la 1) y reinicia el cursor al margen superior (20 mm)
            doc.addPage();
            ctx.y = margen;
            ctx.sectionTitle(t('project_information'));
            ctx.bodyStyle();

            // Etiqueta en negrita en x = margen; el valor va en x = margen + 50 (columna de valores).
            // CONFIGURABLE: 50 = distancia (mm) etiqueta-valor; aumenta si la etiqueta en inglés/español se pisa.
            doc.setFont('helvetica', 'bold');
            doc.text(t('project_name_label'), margen, ctx.y);
            doc.setFont('helvetica', 'normal');
            doc.text(data.projectName || t('unnamed_project'), margen + 50, ctx.y);
            // CONFIGURABLE: salto (mm) tras la línea del nombre
            ctx.y += 10;

            if (data.projectDescription && data.projectDescription.trim()) {
                doc.setFont('helvetica', 'bold');
                doc.text(t('description_label'), margen, ctx.y);
                doc.setFont('helvetica', 'normal');
                // CONFIGURABLE: espacio (mm) entre la etiqueta "Descripción:" y el texto
                ctx.y += 8;

                // Ancho útil = 210 - 2*20 = 170 mm; cada línea resultante se dibuja con salto de página propio
                doc.splitTextToSize(data.projectDescription, ctx.anchoPagina - 2 * margen).forEach(linea => {
                    ctx.ensureSpace(280);
                    doc.text(linea, margen, ctx.y);
                    // CONFIGURABLE: interlineado (mm) de la descripción (12 pt ~ 4,2 mm de letra)
                    ctx.y += 7;
                });
            } else {
                // Sin descripción: etiqueta + texto "(Sin descripción)" en la misma línea (x = margen + 50)
                doc.setFont('helvetica', 'bold');
                doc.text(t('description_label'), margen, ctx.y);
                doc.setFont('helvetica', 'normal');
                doc.text(t('no_description'), margen + 50, ctx.y);
                ctx.y += 10;
            }
            // CONFIGURABLE: espacio (mm) al final de la sección
            ctx.y += 15;
        }
    };
})(window.PFM = window.PFM || {});
