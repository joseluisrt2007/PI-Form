// ========== ALMACENAMIENTO LOCAL (equivalente a storage.py) ==========
if (!localStorage.getItem('projectData')) {
    localStorage.setItem('projectData', JSON.stringify({}));
}

// ========== FUNCIONES GLOBALES ==========

/**
 * Navega a la página de criterios
 */
function goToCriterios() {
    window.location.href = 'criterios.html';
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
        // Actualizar tooltip traducido si está disponible
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

// ========== INICIALIZACIÓN AL CARGAR LA PÁGINA ==========

/**
 * Configura todos los eventos y estados iniciales
 */
function initializePage() {
    // ========== CONFIGURAR SELECTOR DE IDIOMA ==========
    const langSelector = document.getElementById('languageSelector');
    if (langSelector) {
        const currentLang = localStorage.getItem('preferredLanguage') || 'es';
        langSelector.value = currentLang;
        
        langSelector.addEventListener('change', function() {
            if (typeof setLanguage === 'function') {
                setLanguage(this.value);
                updateThemeButton(); // Actualizar tooltip en nuevo idioma
            } else {
                console.error('setLanguage function not found. Make sure lang.js is loaded.');
            }
        });
    }
    
    // ========== CONFIGURAR TEMA OSCURO ==========
    const themeToggle = document.getElementById('themeToggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    // Aplicar tema guardado
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeButton();
    
    // Cambiar tema al hacer clic
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

// ========== EJECUCIÓN AL CARGAR EL DOM ==========
document.addEventListener('DOMContentLoaded', initializePage);

// ========== EXPORTAR FUNCIONES PARA USO GLOBAL (opcional) ==========
// Si usas módulos ES6, puedes exportar así:
// export { goToCriterios, updateThemeButton, initializePage };

// Para uso global tradicional:
window.goToCriterios = goToCriterios;
window.updateThemeButton = updateThemeButton;
window.initializePage = initializePage;