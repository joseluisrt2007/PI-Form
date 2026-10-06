/**
 * ============================================================================
 * core/html.js  ->  PFM.html
 * ============================================================================
 * Utilidades para construir HTML con texto escrito por el usuario sin que se
 * interprete como etiquetas ni rompa atributos. Úsalas SIEMPRE que un nombre de
 * idea, criterio, proyecto, etc. vaya dentro de una plantilla que se asigna a
 * innerHTML (o de un atributo value="...").
 *
 * API PÚBLICA (PFM.html):
 *   escape(texto) -> string   escapa & < > " '  (sirve para contenido y para atributos)
 *
 * Sin dependencias ni localStorage. Orden de carga: después de js/core/storage.js y antes
 * de js/shared/* y js/pages/* (ver docs/ARQUITECTURA.md).
 * ============================================================================
 */
(function (PFM) {
    'use strict';

    // Mapa de caracteres peligrosos -> entidades HTML.
    const ENTIDADES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

    /**
     * Escapa un valor para insertarlo como texto o dentro de un atributo HTML.
     * @param {*} texto  Cualquier valor; null/undefined se tratan como ''.
     * @returns {string} Texto seguro (nunca se interpreta como HTML).
     */
    function escape(texto) {
        return String(texto == null ? '' : texto).replace(/[&<>"']/g, c => ENTIDADES[c]);
    }

    PFM.html = { escape };
})(window.PFM = window.PFM || {});
