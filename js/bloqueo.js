// ========== VARIABLES GLOBALES ==========
const data = JSON.parse(localStorage.getItem('projectData') || '{}');

// ========== FUNCIONES PRINCIPALES ==========

/**
 * Configura el botón de cambio de tema
 */
function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    // Aplicar tema guardado
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeButton(themeToggle);
    
    // Cambiar tema al hacer clic
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const current = document.documentElement.getAttribute('data-theme');
            const newTheme = current === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeButton(themeToggle);
        });
    }
}

/**
 * Actualiza el icono y tooltip del botón de tema
 */
function updateThemeButton(button) {
    if (!button) return;
    
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    
    if (currentTheme === 'dark') {
        button.textContent = '☀️';
        button.title = 'Cambiar a modo claro';
        // Actualizar tooltip traducido si está disponible
        if (typeof t === 'function') {
            button.title = t('theme_light') || 'Cambiar a modo claro';
        }
    } else {
        button.textContent = '🌙';
        button.title = 'Cambiar a modo oscuro';
        if (typeof t === 'function') {
            button.title = t('theme_dark') || 'Cambiar a modo oscuro';
        }
    }
}

/**
 * Configura el selector de idioma
 */
function setupLanguageSelector() {
    const langSelector = document.getElementById('languageSelector');
    if (!langSelector) return;
    
    const currentLang = localStorage.getItem('preferredLanguage') || 'es';
    langSelector.value = currentLang;
    
    langSelector.addEventListener('change', function() {
        if (typeof setLanguage === 'function') {
            setLanguage(this.value);
            // Actualizar el botón de tema con nueva traducción
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) updateThemeButton(themeToggle);
        } else {
            console.error('setLanguage function not found. Make sure lang.js is loaded.');
        }
    });
}

/**
 * Configura el botón de regreso para usar history o redirección
 */
function setupBackButton() {
    const backButton = document.querySelector('.btn-return');
    if (!backButton) return;
    
    backButton.addEventListener('click', function() {
        // Intentar ir hacia atrás en el historial
        if (window.history.length > 1) {
            window.history.back();
        } else {
            // Si no hay historial, ir al menú principal
            window.location.href = 'index.html';
        }
    });
}

/**
 * Aplica traducciones cuando están disponibles
 */
function applyTranslationsWhenReady() {
    // Si el sistema de traducción ya está cargado, aplicarlo
    if (typeof applyTranslations === 'function') {
        applyTranslations();
    } else {
        // Si no, esperar a que se cargue
        document.addEventListener('DOMContentLoaded', function() {
            if (typeof applyTranslations === 'function') {
                applyTranslations();
            }
        });
    }
}

/**
 * Inicializa la página
 */
function initializePage() {
    // Configurar controles
    setupThemeToggle();
    setupLanguageSelector();
    setupBackButton();
    
    // Aplicar traducciones
    applyTranslationsWhenReady();
    
    // Actualizar el botón de tema después de que se carguen las traducciones
    setTimeout(() => {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) updateThemeButton(themeToggle);
    }, 100);
}

// ========== EJECUCIÓN AL CARGAR ==========
// Si el DOM ya está cargado, inicializar inmediatamente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
} else {
    initializePage();
}

// ========== EXPORTAR FUNCIONES PARA USO GLOBAL ==========
window.setupThemeToggle = setupThemeToggle;
window.setupLanguageSelector = setupLanguageSelector;