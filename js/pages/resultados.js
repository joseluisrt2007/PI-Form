/**
 * ============================================================================
 * js/pages/resultados.js  ->  lógica de resultados.html (última página del flujo)
 * ============================================================================
 * Genera y descarga automáticamente el informe PDF del proyecto (js/pdf/) y permite
 * volver a descargarlo.
 *
 * El PDF se genera una sola vez al abrir la página, con el idioma del momento;
 * cambiar de idioma después solo traduce la página, no regenera el PDF.
 *
 * API PÚBLICA: ninguna. Es una IIFE que no publica nada en PFM; se auto-inicia en
 * DOMContentLoaded.
 *
 * DEPENDENCIAS Y ORDEN DE CARGA (ver resultados.html, que carga en este orden):
 *   - jsPDF 2.5.1 (CDN, en el <head>): expone window.jspdf. Si falta, generarPDF()
 *     avisa con alert y no genera nada.
 *   - i18n/es.js, en.js, core/i18n.js, storage.js, theme.js, flow.js, page.js,
 *     core/file-io.js (PFM.fileIO.downloadBlob), shared/scoring.js.
 *   - i18n/pdf.js (PFM.pdfStrings) e i18n/resultados.js (PFM.resultadosStrings).
 *   - js/pdf/* (PFM.pdf.generateReport) y TODAS las secciones antes de report.js.
 *   - este archivo va el último.
 *   Este archivo lee PFM.storage en el momento de cargarse (const data de abajo),
 *   así que storage.js debe estar ya cargado.
 *
 * IDs DEL DOM (en resultados.html; los ausentes se ignoran sin avisar, salvo
 * los marcados):
 *   appTitleText, projectLabel, reportTitle, filenameLabel, downloadAgainBtn,
 *   returnMainMenuBtn  -> textos que reescribe updateInterface().
 *   pdfDownloadInfo    -> se rellena con innerHTML (el texto trae un <br>).
 *   filenameDisplay    -> OBLIGATORIO: mostrarNombreDeArchivo() no comprueba que exista.
 *   downloadAgainBtn y returnMainMenuBtn también son obligatorios para los
 *   addEventListener del arranque.
 *
 * localStorage: SOLO LEE projectData (vía PFM.storage.load()), concretamente
 *   projectName para el nombre del archivo; el PDF usa el resto del proyecto.
 *   No escribe nada.
 * ============================================================================
 */
(function () {
    'use strict';

    // Foto de projectData tomada UNA vez al cargar el script: el PDF y el nombre de archivo
    // usan estos datos aunque localStorage cambie después (p. ej. desde otra pestaña).
    const data = PFM.storage.load();
    // Blob del PDF ya generado (null hasta que generarPDF() corre) y su nombre de archivo.
    let pdfBlob = null;
    let filename = '';
    // Id del setTimeout que genera el PDF automáticamente; el botón lo cancela si se adelanta.
    let temporizadorPDF = null;

    /**
     * Texto de esta página en el idioma actual (i18n/resultados.js).
     * @param {string} key  Clave de PFM.resultadosStrings[idioma].
     * @returns {string} La traducción o, si falta la clave, la propia clave.
     */
    function ui(key) {
        const table = PFM.resultadosStrings[PFM.i18n.getLang()];
        return (table && table[key]) || key;
    }

    /**
     * Nombre del PDF: informe_<nombre del proyecto>.pdf.
     * @returns {string} Con 'proyecto' si no hay nombre. Los espacios pasan a "_" y los caracteres
     *          que los sistemas de archivos no admiten (\ / : * ? " < > | y de control) también;
     *          las tildes y la "ñ" se conservan.
     */
    function nombreDeArchivo() {
        const base = (data.projectName || 'proyecto')
            .replace(/[\\/:*?"<>|\u0000-\u001f\s]+/g, '_')   // ilegales y espacios -> un solo "_"
            .replace(/^_+|_+$/g, '');                          // sin "_" al inicio o al final
        return `informe_${base || 'proyecto'}.pdf`;
    }

    /**
     * Traduce los textos de la página (no usa data-i18n: ver i18n/resultados.js).
     * Se llama al iniciar y en cada cambio de idioma (onLanguageChange de PFM.page.init).
     */
    function updateInterface() {
        // Mapa id del elemento -> texto traducido (ver los IDs en la cabecera).
        const textos = {
            appTitleText: ui('app_title'),
            projectLabel: ui('project'),
            reportTitle: ui('report_generated'),
            filenameLabel: ui('pdf_filename'),
            downloadAgainBtn: ui('download_pdf'),
            returnMainMenuBtn: ui('return_main_menu')
        };
        Object.keys(textos).forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = textos[id];
        });

        // Este texto lleva un <br>
        // innerHTML es seguro aquí: el contenido sale de i18n/resultados.js (texto fijo del
        // proyecto), nunca de datos del usuario.
        const info = document.getElementById('pdfDownloadInfo');
        if (info) info.innerHTML = ui('pdf_download_info');

        // El título de la pestaña se arma aquí (el <title> del HTML solo es el valor inicial en español).
        document.title = 'Resultados - ' + (PFM.i18n.getLang() === 'es' ? 'Actividades de Mejora' : 'Improvement Activities');
    }

    /** Escribe el nombre del PDF en #filenameDisplay (el elemento debe existir). */
    function mostrarNombreDeArchivo() {
        document.getElementById('filenameDisplay').textContent = filename;
    }

    /**
     * Genera el PDF con PFM.pdf.generateReport(data), actualiza el nombre mostrado y lo
     * descarga. Deja el Blob en `pdfBlob` para las descargas siguientes sin regenerar.
     * Se llama a los 1000 ms de abrir la página y, si el usuario pulsa "Descargar de nuevo"
     * antes de que exista el Blob, desde ese botón. En ese caso el clic cancela el temporizador
     * (temporizadorPDF) para que el archivo no se descargue dos veces.
     */
    function generarPDF() {
        // window.jspdf lo define la librería jsPDF (CDN); sin Internet no existe.
        if (typeof window.jspdf === 'undefined') {
            console.error('Error: jsPDF no está cargado.');
            alert(PFM.i18n.t('error_jspdf_missing'));
            return;
        }

        pdfBlob = PFM.pdf.generateReport(data);
        filename = nombreDeArchivo();
        mostrarNombreDeArchivo();
        PFM.fileIO.downloadBlob(filename, pdfBlob);
    }

    document.addEventListener('DOMContentLoaded', function () {
        // Sin `page`: esta página no conecta Continuar/Regreso (no los tiene). Al cambiar de idioma
        // PFM.page.init llama a updateInterface para repintar los textos de esta página.
        PFM.page.init({ onLanguageChange: updateInterface });
        updateInterface();

        filename = nombreDeArchivo();
        mostrarNombreDeArchivo();

        document.getElementById('downloadAgainBtn').addEventListener('click', function () {
            if (pdfBlob) {
                PFM.fileIO.downloadBlob(filename, pdfBlob);
            } else {
                clearTimeout(temporizadorPDF);
                generarPDF();
            }
        });

        document.getElementById('returnMainMenuBtn').addEventListener('click', function () {
            PFM.page.navigate('index.html');
        });

        // Pequeña espera para que la página termine de pintarse antes de descargar
        // CONFIGURABLE: 1000 ms de retraso antes de generar y descargar el PDF automáticamente.
        // generateReport es síncrono y puede bloquear la interfaz unos instantes; subirlo da
        // más margen para pintar la página, bajarlo la hace más reactiva.
        temporizadorPDF = setTimeout(generarPDF, 1000);
    });
})();
