/**
 * ============================================================================
 * core/file-io.js  ->  PFM.fileIO
 * ============================================================================
 * Utilidades de archivos: descargas y exportar/importar archivos .txt de texto plano
 * (necesidades, ideas y evaluación). Formato: una línea de cabecera
 * (p. ej. IDEAS_CONCEPTOS_V1) + una línea por fila con campos separados por tabulador.
 *
 * API PÚBLICA (PFM.fileIO):
 *   safeName(base, fallback)            -> string   nombre de archivo seguro (sin extensión)
 *   downloadBlob(filename, blob)        -> void     dispara la descarga de un Blob
 *   downloadText(filename, content)     -> void     descarga un string como .txt (UTF-8)
 *   readSelectedFile(event, onText, logLabel) -> void  manejador de <input type="file"> change
 *   contentLines(text, headerPrefix)    -> string[] líneas útiles del .txt (sin cabecera ni vacías)
 *   splitFields(line, minFields, trimFallback) -> string[]  campos de una línea
 *
 * QUIÉN LO USA: js/pages/ideas.js, necesidades.js y evaluacion.js (guardar/cargar .txt)
 *   y js/pages/resultados.js (downloadBlob para el PDF). El asistente IA NO lo usa
 *   (js/features/assistant.js tiene su propia descarga).
 *
 * DEPENDE DE: PFM.i18n (clave 'error_loading_file', definida en i18n/es.js y en.js).
 *   Orden de carga: después de core/i18n.js. Se carga solo en las páginas que lo
 *   necesitan (ver docs/ARQUITECTURA.md, punto 3 del orden de carga).
 *
 * localStorage: NO lee ni escribe nada.
 * ============================================================================
 */
(function (PFM) {
    'use strict';

    /**
     * Nombre de archivo seguro a partir de un texto libre.
     * @param {string} base      Texto de origen (p. ej. el nombre del proyecto); puede estar vacío/undefined.
     * @param {string} fallback  Nombre usado si `base` está vacío o queda vacío tras limpiarlo.
     * @returns {string} Solo letras, dígitos, "_" y "-"; el resto se reemplaza por "_".
     */
    function safeName(base, fallback) {
        const text = (base || fallback).trim();
        // Regex 1: cualquier racha de caracteres que NO sean a-z, 0-9, "_" o "-" (flag i = sin
        //          distinguir mayúsculas) se sustituye por un solo "_". Las tildes y la "ñ" también
        //          se sustituyen. Para permitir más caracteres, amplía la clase [^...].
        // Regex 2: quita guiones bajos sobrantes al inicio o al final.
        // Si queda vacío (p. ej. el nombre era solo símbolos) se usa `fallback`.
        return text.replace(/[^a-z0-9_\-]+/gi, '_').replace(/^_+|_+$/g, '') || fallback;
    }

    /**
     * Descarga un Blob (texto, PDF, ...) con el nombre indicado.
     * @param {string} filename  Nombre que verá el usuario (incluye extensión).
     * @param {Blob} blob        Contenido a descargar.
     */
    function downloadBlob(filename, blob) {
        const url = URL.createObjectURL(blob);

        // Truco estándar: un <a download> temporal al que se le hace click por código.
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        // Libera la URL temporal. (Se revoca de inmediato; funciona en los navegadores actuales.)
        URL.revokeObjectURL(url);
    }

    /**
     * Descarga `content` como archivo de texto.
     * @param {string} filename  Nombre del archivo (con .txt).
     * @param {string} content   Texto completo del archivo.
     */
    function downloadText(filename, content) {
        // CONFIGURABLE: la codificación (utf-8) debe coincidir con la de readAsText() en
        // readSelectedFile; si cambias una, cambia la otra o se verán mal las tildes.
        downloadBlob(filename, new Blob([content], { type: 'text/plain;charset=utf-8' }));
    }

    /**
     * Manejador para el evento `change` de un <input type="file">.
     * Lee el archivo como texto y llama a onText(texto). Si onText lanza un
     * error o el archivo no se puede leer, muestra un alert traducido.
     * @param {Event} event         Evento `change` del input (se usa event.target.files[0]).
     * @param {function(string):void} onText  Recibe el contenido completo del archivo.
     * @param {string} [logLabel]   Etiqueta solo para el mensaje de console.error ('datos' por defecto).
     */
    function readSelectedFile(event, onText, logLabel) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                onText(e.target.result);
            } catch (err) {
                console.error('Error al procesar el archivo de ' + (logLabel || 'datos') + ':', err);
                alert(PFM.i18n.t('error_loading_file'));
            }
        };
        reader.onerror = function () {
            alert(PFM.i18n.t('error_loading_file'));
        };
        // CONFIGURABLE: codificación de lectura; ver nota en downloadText.
        reader.readAsText(file, 'utf-8');

        // Permite volver a seleccionar el mismo archivo más adelante
        // (sin esto, el navegador no dispara `change` si se elige el mismo archivo otra vez).
        // Es seguro vaciarlo aquí porque FileReader ya tiene la referencia al archivo.
        event.target.value = '';
    }

    /**
     * Líneas no vacías del texto, sin la cabecera (línea que empieza con headerPrefix).
     * @param {string} text          Contenido completo del .txt.
     * @param {string} headerPrefix  Prefijo de la cabecera a descartar (p. ej. 'IDEAS_CONCEPTOS',
     *                               sin el sufijo _V1, para aceptar futuras versiones).
     * @returns {string[]} Líneas recortadas (trim) y filtradas.
     */
    function contentLines(text, headerPrefix) {
        return text
            .split(/\r?\n/)   // acepta saltos de línea Windows (\r\n) y Unix (\n)
            .map(l => l.trim())
            .filter(l => l.length > 0 && !l.startsWith(headerPrefix));
    }

    /**
     * Separa una línea en campos: primero por tabulador; si salen menos de
     * `minFields`, por ';' o ','. Con trimFallback los campos de este segundo
     * caso se recortan.
     * @param {string} line            Una línea de contenido (ver contentLines).
     * @param {number} minFields       Nº mínimo de campos para aceptar la separación por tabulador
     *                                 (ideas: 2, necesidades: 3, evaluación: 4).
     * @param {boolean} [trimFallback] true -> aplica trim() a cada campo del caso ';' / ','.
     * @returns {string[]} Campos (el llamador debe comprobar que hay los necesarios).
     * CUIDADO: si el texto de una idea contiene una coma o ';' y el archivo no usa tabuladores,
     * la línea se partirá en más campos de los esperados (por eso el asistente IA genera tabuladores).
     */
    function splitFields(line, minFields, trimFallback) {
        let fields = line.split('\t');
        if (fields.length < minFields) {
            fields = line.split(/[;,]/);
            if (trimFallback) fields = fields.map(c => c.trim());
        }
        return fields;
    }

    PFM.fileIO = { safeName, downloadBlob, downloadText, readSelectedFile, contentLines, splitFields };
})(window.PFM = window.PFM || {});
