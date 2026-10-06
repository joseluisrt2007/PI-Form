/**
 * ============================================================================
 * i18n/resultados.js  ->  PFM.resultadosStrings  (textos de resultados.html)
 * ============================================================================
 * Textos de la página resultados.html (es / en). Se usan desde js/pages/resultados.js
 * mediante su función ui(clave). NOTA: app_title aquí difiere del de i18n/es.js e
 * i18n/en.js (comportamiento heredado de la versión original: esta página nunca usó el
 * sistema de traducción común).
 *
 * ESTRUCTURA: PFM.resultadosStrings = { es: { clave: texto }, en: { clave: texto } }.
 * Las claves tienen el mismo nombre que las de i18n/es.js pero NO pasan por PFM.i18n.t:
 * resultados.html no usa atributos data-i18n; resultados.js escribe cada texto por el id
 * de su elemento.
 *
 * AGREGAR UN TEXTO: añadir la clave en `es` y `en` aquí, y en
 * updateInterface() de js/pages/resultados.js asociarla al id del elemento
 * (o usar ui('clave') donde se necesite).
 * AGREGAR UN IDIOMA: añadir un bloque con todas las claves aquí y ver la cabecera de
 * i18n/es.js para el resto de pasos (el selector de idioma y core/i18n.js).
 *
 * CUIDADO: 'pdf_download_info' contiene un <br> y se inserta con innerHTML; no pongas aquí
 * texto del usuario. 'theme_light' y 'theme_dark' NO se leen en esta página (el botón de
 * tema usa i18n/es.js y en.js vía PFM.theme).
 *
 * Carga: solo en resultados.html, antes de js/pages/resultados.js. No usa localStorage.
 * ============================================================================
 */
(function (PFM) {
    PFM.resultadosStrings = {
        es: {
        'app_title': 'Desarrollo de Formularios para Actividades de Mejora',
        'project': 'Proyecto:',
        'report_generated': '¡Informe generado con éxito!',
        'pdf_download_info': 'El informe PDF de su proyecto ha sido generado y descargado automáticamente.<br>Puede encontrarlo en la carpeta de descargas de su navegador.',
        'pdf_filename': 'Nombre del archivo:',
        'download_pdf': '📄 Descargar PDF nuevamente',
        'return_main_menu': '🏠 Volver al menú principal',
        // SIN USO en esta página (ver CUIDADO de la cabecera)
        'theme_light': 'Cambiar a modo claro',
        'theme_dark': 'Cambiar a modo oscuro'
        },
        en: {
        'app_title': 'Development of Forms for Improvement Activities',
        'project': 'Project:',
        'report_generated': 'Report generated successfully!',
        'pdf_download_info': 'Your project PDF report has been generated and downloaded automatically.<br>You can find it in your browser\'s downloads folder.',
        'pdf_filename': 'File name:',
        'download_pdf': '📄 Download PDF again',
        'return_main_menu': '🏠 Return to main menu',
        // SIN USO en esta página (ver CUIDADO de la cabecera)
        'theme_light': 'Switch to light mode',
        'theme_dark': 'Switch to dark mode'
        }
    };
})(window.PFM = window.PFM || {});
