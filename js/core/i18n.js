/**
 * ============================================================================
 * core/i18n.js  ->  PFM.i18n
 * ============================================================================
 * Sistema de traducción (es / en).
 *
 * Las cadenas viven en i18n/es.js e i18n/en.js (PFM.translations).
 * Este archivo solo contiene la lógica:
 *   PFM.i18n.t(clave, {variables})      -> texto traducido (si no existe devuelve la clave)
 *   PFM.i18n.setLanguage('es'|'en')     -> guarda la preferencia y re-traduce la página
 *   PFM.i18n.getLang()                  -> idioma actual
 *   PFM.i18n.applyTranslations()        -> aplica data-i18n, data-i18n-placeholder, etc. al DOM
 *   PFM.i18n.formatDate(fecha, 'short'|'long')
 *
 * Atributos HTML soportados: data-i18n, data-i18n-placeholder, data-i18n-title,
 * data-i18n-value, data-i18n-alt.
 *
 * Requiere: i18n/es.js e i18n/en.js cargados antes.
 *
 * localStorage: lee y escribe 'preferredLanguage' ('es' | 'en'). Es una preferencia
 *   fuera de projectData; NO renombrar la clave (se perdería el idioma elegido).
 *
 * EVENTOS: al terminar applyTranslations() dispara en `window` el evento
 *   'translationsApplied' con detail: { lang }. Otros scripts pueden escucharlo
 *   para repintar contenido dinámico.
 *
 * AGREGAR UN IDIOMA: ver la cabecera de i18n/es.js (crear i18n/<lang>.js, cargarlo
 *   en cada HTML antes de core/i18n.js y añadir una <option> al #languageSelector).
 * ============================================================================
 */
(function (PFM) {
    'use strict';

    // Diccionarios ya cargados por i18n/es.js e i18n/en.js (si el orden de carga fuera
    // incorrecto quedaría {} y t() fallaría al leer translations[currentLang]).
    const translations = PFM.translations || {};
    // CONFIGURABLE: clave de localStorage de la preferencia de idioma. Se usa también en
    // setLanguage() (más abajo). Cambiarla hace que se "olvide" el idioma de los usuarios actuales.
    const stored = localStorage.getItem('preferredLanguage');
    // CONFIGURABLE: idioma por defecto ('es') cuando no hay preferencia guardada o el código
    // guardado no existe en `translations`. Debe ser una clave existente de PFM.translations.
    let currentLang = translations[stored] ? stored : 'es';

    /** @returns {string} Código del idioma actual ('es' | 'en'). */
    function getLang() {
        return currentLang;
    }

    /**
     * Cambia el idioma, guarda la preferencia y re-traduce la página.
     * @param {string} lang  Código que exista en PFM.translations ('es' | 'en').
     * @returns {boolean} true si se cambió; false si el idioma no existe (no hace nada).
     */
    function setLanguage(lang) {
        if (translations[lang]) {
            currentLang = lang;
            localStorage.setItem('preferredLanguage', lang);
            applyTranslations();
            return true;
        }
        return false;
    }

    /**
     * Devuelve la traducción de `key`; reemplaza {{variable}} con `variables`.
     * @param {string} key                       Clave de i18n/es.js / en.js.
     * @param {Object<string,*>} [variables]     Valores para los marcadores {{nombre}} del texto.
     * @returns {string} Texto traducido; si la clave no existe (o su texto es vacío), la propia clave.
     * CUIDADO: el reemplazo usa String.replace con el valor como cadena de reemplazo, así que
     * un valor que contenga "$&" o "$1" se interpretaría de forma especial.
     */
    function t(key, variables) {
        let text = translations[currentLang][key] || key;
        Object.keys(variables || {}).forEach(name => {
            // Construye /{{nombre}}/g : sustituye todas las apariciones del marcador.
            text = text.replace(new RegExp(`{{${name}}}`, 'g'), variables[name]);
        });
        return text;
    }

    /**
     * Recorre el DOM y aplica las traducciones según los atributos data-i18n*.
     * Se ejecuta en DOMContentLoaded y cada vez que cambia el idioma.
     */
    function applyTranslations() {
        // data-i18n="clave": comportamiento según el tipo de elemento.
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const text = t(key);

            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                // En campos de texto, data-i18n traduce el placeholder (no el valor).
                el.placeholder = text;
            } else if (el.tagName === 'SELECT') {
                // En un <select>, data-i18n traduce solo la <option> cuyo value sea igual a la clave.
                const option = el.querySelector(`option[value="${key}"]`);
                if (option) option.textContent = text;
            } else {
                el.textContent = text; // incluye <title>
                // CUIDADO: textContent no interpreta HTML; los textos con <br> deben ir por otra vía.
            }
        });

        // Atributos específicos: se traduce el atributo indicado en vez del contenido.
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
        });
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            el.title = t(el.getAttribute('data-i18n-title'));
        });
        document.querySelectorAll('[data-i18n-value]').forEach(el => {
            el.value = t(el.getAttribute('data-i18n-value'));
        });
        document.querySelectorAll('[data-i18n-alt]').forEach(el => {
            el.alt = t(el.getAttribute('data-i18n-alt'));
        });

        // Pie de página (si no tiene data-i18n propio)
        // Selector: <footer role="contentinfo"> (clave 'footer_text'); solo actúa si el HTML lo tiene.
        const footer = document.querySelector('footer[role="contentinfo"]');
        if (footer && !footer.hasAttribute('data-i18n')) {
            footer.textContent = t('footer_text');
        }

        // Avisa a quien quiera repintar contenido dinámico (ver cabecera).
        window.dispatchEvent(new CustomEvent('translationsApplied', { detail: { lang: currentLang } }));
    }

    /**
     * Fecha en formato corto/largo según el idioma actual.
     * @param {Date} date                 Fecha a formatear.
     * @param {'short'|'long'} [format]   'short' (por defecto) o 'long' (con día de la semana).
     * @returns {string} Fecha formateada (es: 31/12/2025; en: Dec 31, 2025).
     */
    function formatDate(date, format) {
        // CONFIGURABLE: opciones de Intl por idioma/formato. Al añadir un idioma nuevo hay que
        // añadir aquí su entrada (si no, options[currentLang] es undefined y falla) y mapear
        // su locale en la llamada de más abajo.
        const options = {
            es: {
                short: { day: '2-digit', month: '2-digit', year: 'numeric' },
                long: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
            },
            en: {
                short: { month: 'short', day: '2-digit', year: 'numeric' },
                long: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
            }
        };
        // CONFIGURABLE: locales BCP-47 usados ('es-ES' / 'en-US'); cámbialos p. ej. por 'es-MX'
        // para otro formato regional.
        return date.toLocaleDateString(
            currentLang === 'es' ? 'es-ES' : 'en-US',
            options[currentLang][format || 'short']
        );
    }

    PFM.i18n = { t, setLanguage, getLang, applyTranslations, formatDate };

    // Traduce la página al terminar de cargar el DOM (no hace falta llamarlo desde cada página).
    document.addEventListener('DOMContentLoaded', applyTranslations);
})(window.PFM = window.PFM || {});
