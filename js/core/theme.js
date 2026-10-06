/**
 * ============================================================================
 * core/theme.js  ->  PFM.theme
 * ============================================================================
 * Tema claro / oscuro.
 * Guarda la preferencia en localStorage['theme'] y la aplica como
 * atributo data-theme en <html> (los estilos usan [data-theme="dark"]).
 *
 * Espera en el HTML un botón con id="themeToggle".
 *
 * API PÚBLICA (PFM.theme):
 *   init()          -> void    aplica el tema guardado y conecta el botón (lo llama PFM.page.init)
 *   updateButton()  -> void    repinta icono y tooltip del botón (llamar tras cambiar de idioma)
 *   current()       -> 'light' | 'dark'   tema aplicado ahora
 *
 * DEPENDE DE: PFM.i18n (claves 'theme_light' y 'theme_dark'). Cargar después de core/i18n.js.
 * localStorage: lee y escribe 'theme' ('light' | 'dark'). Fuera de projectData.
 * CSS: css/base.css (y css de cada página) define las variables bajo [data-theme="dark"];
 *   si añades un tercer tema hay que definirlo allí y adaptar el alternado de este archivo.
 * HTML: el botón #themeToggle está en las 12 páginas (incluida index.html).
 * ============================================================================
 */
(function (PFM) {
    'use strict';

    /** @returns {string} Tema actual leído del atributo data-theme ('light' si aún no hay). */
    function current() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    }

    /** Actualiza el icono y el tooltip del botón según el tema y el idioma actuales. */
    function updateButton() {
        const button = document.getElementById('themeToggle');
        if (!button) return;

        // El botón muestra el tema AL QUE se cambiará al pulsarlo (sol en oscuro, luna en claro).
        // CONFIGURABLE: los emojis del icono; los textos del tooltip están en las claves
        // 'theme_light' / 'theme_dark' de i18n/es.js y en.js.
        if (current() === 'dark') {
            button.textContent = '☀️';
            button.title = PFM.i18n.t('theme_light');
        } else {
            button.textContent = '🌙';
            button.title = PFM.i18n.t('theme_dark');
        }
    }

    /** Aplica el tema guardado y conecta el botón. */
    function init() {
        // CONFIGURABLE: 'light' es el tema por defecto si no hay preferencia guardada.
        document.documentElement.setAttribute('data-theme', localStorage.getItem('theme') || 'light');
        updateButton();

        const button = document.getElementById('themeToggle');
        if (button) {
            button.addEventListener('click', function () {
                // Alterna entre los dos únicos temas y persiste la elección.
                const next = current() === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', next);
                localStorage.setItem('theme', next);
                updateButton();
            });
        }
    }

    PFM.theme = { init, updateButton, current };
})(window.PFM = window.PFM || {});
