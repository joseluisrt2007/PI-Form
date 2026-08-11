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
    window.location.href = getPreviousPage('ideas.html');
}

function continueToNext() {
    document.querySelectorAll('.concepto').forEach(el => {
        data[`concepto${el.dataset.id}`] = el.value.trim();
    });
    localStorage.setItem('projectData', JSON.stringify(data));
    window.location.href = getNextPage('ideas.html');
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

// ========== EXPORTAR / IMPORTAR IDEAS (.txt) ==========

function getIdeasFilename() {
    const base = (data.projectName || 'ideas').trim();
    const safeBase = base.replace(/[^a-z0-9_\-]+/gi, '_').replace(/^_+|_+$/g, '') || 'ideas';
    return `${safeBase}_ideas_conceptos.txt`;
}

function construirContenidoTXT() {
    const lineas = ['IDEAS_CONCEPTOS_V1'];
    for (let i = 1; i <= NUM_CRITERIOS; i++) {
        const el = document.querySelector(`.concepto[data-id="${i}"]`);
        const valor = el ? el.value.trim() : '';
        lineas.push(`${i}\t${valor}`);
    }
    return lineas.join('\n');
}

function guardarIdeasTXT() {
    saveData();

    const contenido = construirContenidoTXT();
    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = getIdeasFilename();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function aplicarContenidoTXT(texto) {
    const lineas = texto
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l.length > 0 && !l.startsWith('IDEAS_CONCEPTOS'));

    lineas.forEach(linea => {
        let campos = linea.split('\t');
        if (campos.length < 2) {
            campos = linea.split(/[;,]/);
        }
        if (campos.length < 2) return;

        const id = parseInt(campos[0], 10);
        if (!id || id < 1 || id > NUM_CRITERIOS) return;

        const valor = campos.slice(1).join('\t').trim();
        const el = document.querySelector(`.concepto[data-id="${id}"]`);
        if (el) el.value = valor;
    });

    saveData();
    validateAndEnable();
}

function cargarIdeasTXT(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            aplicarContenidoTXT(e.target.result);
        } catch (err) {
            console.error('Error al procesar el archivo de ideas:', err);
            const msg = (typeof t === 'function' ? t('error_loading_file') : null) ||
                'No se pudo leer el archivo. Verifica que sea un archivo .txt válido generado por esta aplicación.';
            alert(msg);
        }
    };
    reader.onerror = function () {
        const msg = (typeof t === 'function' ? t('error_loading_file') : null) ||
            'No se pudo leer el archivo.';
        alert(msg);
    };
    reader.readAsText(file, 'utf-8');

    event.target.value = '';
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

    // Botones de Cargar/Guardar Ideas en archivo .txt
    const guardarIdeasBtn = document.getElementById('guardarIdeasBtn');
    const cargarIdeasBtn = document.getElementById('cargarIdeasBtn');
    const cargarIdeasInput = document.getElementById('cargarIdeasInput');

    if (guardarIdeasBtn) {
        guardarIdeasBtn.addEventListener('click', guardarIdeasTXT);
    }

    if (cargarIdeasBtn && cargarIdeasInput) {
        cargarIdeasBtn.addEventListener('click', () => cargarIdeasInput.click());
        cargarIdeasInput.addEventListener('change', cargarIdeasTXT);
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