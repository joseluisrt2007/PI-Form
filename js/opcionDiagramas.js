// ========== VARIABLES GLOBALES ==========
const data = JSON.parse(localStorage.getItem('projectData') || '{}');

// ========== FUNCIONES PRINCIPALES ==========

/**
 * Actualiza el nombre del proyecto en la barra de navegación
 */
function updateProjectName() {
    const projectText = document.getElementById('projectNameText');
    
    if (!projectText) return;
    
    if (data.projectName && data.projectName.trim()) {
        projectText.textContent = data.projectName;
    } else {
        if (typeof t === 'function') {
            projectText.textContent = t('unnamed_project') || '(Sin nombre)';
        } else {
            projectText.textContent = '(Sin nombre)';
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
            updateProjectName();
            updateThemeButton();
            aplicarTraducciones();
        } else {
            console.error('setLanguage function not found. Make sure lang.js is loaded.');
        }
    });
}

/**
 * Configura el tema oscuro/claro
 */
function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeButton();
    
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const current = document.documentElement.getAttribute('data-theme');
            const newTheme = current === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeButton();
        });
    }
}

/**
 * Actualiza el icono y tooltip del botón de tema
 */
function updateThemeButton() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    
    if (currentTheme === 'dark') {
        themeToggle.textContent = '☀️';
        themeToggle.title = 'Cambiar a modo claro';
        if (typeof t === 'function') {
            themeToggle.title = t('theme_light') || 'Cambiar a modo claro';
        }
    } else {
        themeToggle.textContent = '🌙';
        themeToggle.title = 'Cambiar a modo oscuro';
        if (typeof t === 'function') {
            themeToggle.title = t('theme_dark') || 'Cambiar a modo oscuro';
        }
    }
}

/**
 * Aplica traducciones a la página
 */
function aplicarTraducciones() {
    // Título de la página
    const titulo = document.querySelector('h1');
    if (titulo && titulo.hasAttribute('data-i18n')) {
        const key = titulo.getAttribute('data-i18n');
        if (typeof t === 'function') {
            titulo.textContent = t(key) || titulo.textContent;
        }
    }
    
    // Pregunta
    const pregunta = document.querySelector('.pregunta');
    if (pregunta && pregunta.hasAttribute('data-i18n')) {
        const key = pregunta.getAttribute('data-i18n');
        if (typeof t === 'function') {
            pregunta.textContent = t(key) || pregunta.textContent;
        }
    }
    
    // Botón Sí
    const btnSi = document.getElementById('btnSi');
    if (btnSi) {
        const spanText = btnSi.querySelector('span:last-child');
        if (spanText && spanText.hasAttribute('data-i18n')) {
            const key = spanText.getAttribute('data-i18n');
            if (typeof t === 'function') {
                spanText.textContent = t(key) || spanText.textContent;
            }
        }
    }
    
    // Botón No
    const btnNo = document.getElementById('btnNo');
    if (btnNo) {
        const spanText = btnNo.querySelector('span:last-child');
        if (spanText && spanText.hasAttribute('data-i18n')) {
            const key = spanText.getAttribute('data-i18n');
            if (typeof t === 'function') {
                spanText.textContent = t(key) || spanText.textContent;
            }
        }
    }
    
    // Botón Regreso
    const btnBack = document.querySelector('.btn-secondary');
    if (btnBack && btnBack.hasAttribute('data-i18n')) {
        const key = btnBack.getAttribute('data-i18n');
        if (typeof t === 'function') {
            btnBack.textContent = t(key) || btnBack.textContent;
        }
    }
}

/**
 * Configura los botones de opción
 */
function setupButtons() {
    const btnSi = document.getElementById('btnSi');
    const btnNo = document.getElementById('btnNo');
    
    if (btnSi) {
        btnSi.addEventListener('click', function() {
            // Guardar preferencia de que el usuario quiere hacer diagramas
            data.realizarDiagramas = true;
            localStorage.setItem('projectData', JSON.stringify(data));
            window.location.href = 'diagrama.html';
        });
    }
    
    if (btnNo) {
        btnNo.addEventListener('click', function() {
            // Guardar preferencia de que el usuario NO quiere hacer diagramas
            data.realizarDiagramas = false;
            localStorage.setItem('projectData', JSON.stringify(data));
            window.location.href = 'opcionConceptos.html';
        });
    }
}

/**
 * Inicializa la página
 */
function initializePage() {
    setupLanguageSelector();
    setupThemeToggle();
    setupButtons();
    updateProjectName();
    aplicarTraducciones();
}

// ========== EJECUCIÓN AL CARGAR EL DOM ==========
document.addEventListener('DOMContentLoaded', initializePage);

// ========== EXPORTAR FUNCIONES PARA USO GLOBAL ==========
window.updateProjectName = updateProjectName;
window.aplicarTraducciones = aplicarTraducciones;