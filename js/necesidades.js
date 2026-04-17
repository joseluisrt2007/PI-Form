// ========== VARIABLES GLOBALES ==========
const data = JSON.parse(localStorage.getItem('projectData') || '{}');
const NUM_CRITERIOS = 5;

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
 * Valida los formularios - SIN RESTRICCIONES - siempre habilita los botones
 */
function validateAndEnable() {
    const guardarBtn = document.getElementById('guardarBtn');
    const continuarBtn = document.getElementById('continuarBtn');
    const errorEl = document.getElementById('pesoError');
    
    // SIN RESTRICCIONES: Siempre habilitar los botones
    if (guardarBtn) {
        guardarBtn.disabled = false;
    }
    if (continuarBtn) {
        continuarBtn.disabled = false;
    }
    
    if (errorEl) {
        errorEl.textContent = '';
    }
}

/**
 * SOLO GUARDA los datos de criterios y pesos (los campos que existen en esta página)
 */
function saveData() {
    // Solo guardar criterios y pesos
    document.querySelectorAll('.criterio').forEach(el => {
        const id = el.dataset.id;
        if (id && parseInt(id) <= NUM_CRITERIOS) {
            data[`criterio${id}`] = el.value.trim();
        }
    });
    
    document.querySelectorAll('.peso').forEach(el => {
        const id = el.dataset.id;
        if (id && parseInt(id) <= NUM_CRITERIOS) {
            data[`peso${id}`] = el.value;
        }
    });
    
    // Guardar en localStorage
    localStorage.setItem('projectData', JSON.stringify(data));
    console.log('Datos guardados correctamente');
}

/**
 * GUARDA y NAVEGA a la siguiente página
 */
function continueToNext() {
    saveData();  // Primero guarda los datos
    window.location.href = 'ideas.html';  // Luego navega
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
 * Configura eventos de entrada - SIN RESTRICCIONES
 */
function setupInputEvents() {
    document.querySelectorAll('.criterio, .peso').forEach(input => {
        input.addEventListener('input', () => {
            validateAndEnable();
        });
    });
}

/**
 * Configura los botones de Guardar y Continuar
 */
function setupButtons() {
    const guardarBtn = document.getElementById('guardarBtn');
    const continuarBtn = document.getElementById('continuarBtn');
    
    if (guardarBtn) {
        guardarBtn.addEventListener('click', saveData);
    }
    
    if (continuarBtn) {
        continuarBtn.addEventListener('click', continueToNext);
    }
}

/**
 * Carga los datos guardados en los formularios
 */
function loadSavedData() {
    document.querySelectorAll('.criterio').forEach(el => {
        const id = el.dataset.id;
        if (id && parseInt(id) <= NUM_CRITERIOS) {
            el.value = data[`criterio${id}`] || '';
        }
    });
    
    document.querySelectorAll('.peso').forEach(el => {
        const id = el.dataset.id;
        if (id && parseInt(id) <= NUM_CRITERIOS) {
            el.value = data[`peso${id}`] || '';
        }
    });
}

/**
 * Inicializa la página
 */
function initializePage() {
    loadSavedData();
    setupLanguageSelector();
    setupThemeToggle();
    setupInputEvents();
    setupButtons();
    updateProjectName();
    validateAndEnable();
}

// ========== EJECUCIÓN AL CARGAR EL DOM ==========
document.addEventListener('DOMContentLoaded', initializePage);

// ========== EXPORTAR FUNCIONES PARA USO GLOBAL ==========
window.updateProjectName = updateProjectName;
window.validateAndEnable = validateAndEnable;
window.saveData = saveData;
window.continueToNext = continueToNext;
window.NUM_CRITERIOS = NUM_CRITERIOS;