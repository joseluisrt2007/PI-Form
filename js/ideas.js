// ========== VARIABLES GLOBALES ==========
const data = JSON.parse(localStorage.getItem('projectData') || '{}');
const NUM_CRITERIOS = 5;

// ========== FUNCIONES PRINCIPALES ==========

function updateProjectName() {
    const projectText = document.getElementById('projectNameText');
    if (projectText) {
        if (data.projectName) {
            projectText.textContent = data.projectName;
        } else {
            if (typeof t === 'function') {
                projectText.textContent = t('unnamed_project') || '(Sin nombre)';
            } else {
                projectText.textContent = '(Sin nombre)';
            }
        }
    }
}

function validateAndEnable() {
    const guardarBtn = document.getElementById('guardarBtn');
    const continuarBtn = document.getElementById('continuarBtn');
    
    if (guardarBtn) {
        guardarBtn.disabled = false;
    }
    if (continuarBtn) {
        continuarBtn.disabled = false;
    }
}

function saveData() {
    document.querySelectorAll('.concepto').forEach(el => {
        data[`concepto${el.dataset.id}`] = el.value.trim();
    });

    localStorage.setItem('projectData', JSON.stringify(data));
    console.log('Datos guardados correctamente');
}

function goToPrevious() {
    window.location.href = 'necesidades.html';
}

function continueToNext() {
    document.querySelectorAll('.concepto').forEach(el => {
        data[`concepto${el.dataset.id}`] = el.value.trim();
    });
    localStorage.setItem('projectData', JSON.stringify(data));
    window.location.href = 'evaluacion.html';
}

function updateThemeButton() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    
    if (currentTheme === 'dark') {
        themeToggle.textContent = '☀️';
        themeToggle.title = 'Cambiar a modo claro';
    } else {
        themeToggle.textContent = '🌙';
        themeToggle.title = 'Cambiar a modo oscuro';
    }
}

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
        }
    });
}

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

function setupInputEvents() {
    document.querySelectorAll('.concepto').forEach(input => {
        input.addEventListener('input', () => {
            validateAndEnable();
        });
    });
}

function setupButtons() {
    const guardarBtn = document.getElementById('guardarBtn');
    const continuarBtn = document.getElementById('continuarBtn');
    const anteriorBtn = document.getElementById('anteriorBtn');
    
    if (guardarBtn) {
        guardarBtn.addEventListener('click', saveData);
    }
    
    if (continuarBtn) {
        continuarBtn.addEventListener('click', continueToNext);
    }
    
    if (anteriorBtn) {
        anteriorBtn.addEventListener('click', goToPrevious);
    }
}

function loadSavedData() {
    document.querySelectorAll('.concepto').forEach(el => {
        el.value = data[`concepto${el.dataset.id}`] || '';
    });
}

function initializePage() {
    loadSavedData();
    setupLanguageSelector();
    setupThemeToggle();
    setupInputEvents();
    setupButtons();
    updateProjectName();
    validateAndEnable();
}

document.addEventListener('DOMContentLoaded', initializePage);