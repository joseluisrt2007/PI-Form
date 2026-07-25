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

// ========== EXPORTAR / IMPORTAR NECESIDADES (.txt) ==========

/**
 * Genera un nombre de archivo seguro a partir del nombre del proyecto.
 */
function getNecesidadesFilename() {
    const base = (data.projectName || 'necesidades').trim();
    const safeBase = base.replace(/[^a-z0-9_\-]+/gi, '_').replace(/^_+|_+$/g, '') || 'necesidades';
    return `${safeBase}_necesidades_prioridades.txt`;
}

/**
 * Construye el contenido de texto plano a partir de los criterios y pesos
 * actualmente escritos en el formulario.
 * Formato: una línea de cabecera + una línea por fila con
 * "id\tcriterio\tpeso"
 */
function construirContenidoTXT() {
    const lineas = ['NECESIDADES_PRIORIDADES_V1'];

    for (let i = 1; i <= NUM_CRITERIOS; i++) {
        const criterioEl = document.querySelector(`.criterio[data-id="${i}"]`);
        const pesoEl = document.querySelector(`.peso[data-id="${i}"]`);
        const criterio = criterioEl ? criterioEl.value.trim() : '';
        const peso = pesoEl ? pesoEl.value.trim() : '';
        lineas.push(`${i}\t${criterio}\t${peso}`);
    }

    return lineas.join('\n');
}

/**
 * Descarga los datos de esta página como archivo .txt
 */
function guardarNecesidadesTXT() {
    saveData(); // Asegura que localStorage quede sincronizado también

    const contenido = construirContenidoTXT();
    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = getNecesidadesFilename();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Aplica el contenido de un archivo .txt cargado a los campos del formulario.
 * Acepta el formato generado por guardarNecesidadesTXT (tabulador) y,
 * como alternativa tolerante, separación por ";" o ",".
 */
function aplicarContenidoTXT(texto) {
    const lineas = texto
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l.length > 0 && !l.startsWith('NECESIDADES_PRIORIDADES'));

    lineas.forEach(linea => {
        let campos = linea.split('\t');
        if (campos.length < 3) {
            campos = linea.split(/[;,]/);
        }
        if (campos.length < 3) return;

        const id = parseInt(campos[0], 10);
        if (!id || id < 1 || id > NUM_CRITERIOS) return;

        const criterio = (campos[1] || '').trim();
        const peso = (campos[2] || '').trim();

        const criterioEl = document.querySelector(`.criterio[data-id="${id}"]`);
        const pesoEl = document.querySelector(`.peso[data-id="${id}"]`);
        if (criterioEl) criterioEl.value = criterio;
        if (pesoEl) pesoEl.value = peso;
    });

    saveData();
    validateAndEnable();
}

/**
 * Maneja la selección de archivo del input de carga y aplica su contenido.
 */
function cargarNecesidadesTXT(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            aplicarContenidoTXT(e.target.result);
        } catch (err) {
            console.error('Error al procesar el archivo de necesidades:', err);
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

    // Permite volver a seleccionar el mismo archivo más adelante
    event.target.value = '';
}

/**
 * GUARDA y NAVEGA a la siguiente página (calculada dinámicamente)
 */
function continueToNext() {
    saveData();  // Primero guarda los datos
    window.location.href = getNextPage('necesidades.html');  // Luego navega
}

/**
 * Navega a la página anterior (calculada dinámicamente)
 */
function goToPrevious() {
    window.location.href = getPreviousPage('necesidades.html');
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

    // Botones de Cargar/Guardar Necesidades en archivo .txt
    const guardarNecesidadesBtn = document.getElementById('guardarNecesidadesBtn');
    const cargarNecesidadesBtn = document.getElementById('cargarNecesidadesBtn');
    const cargarNecesidadesInput = document.getElementById('cargarNecesidadesInput');

    if (guardarNecesidadesBtn) {
        guardarNecesidadesBtn.addEventListener('click', guardarNecesidadesTXT);
    }

    if (cargarNecesidadesBtn && cargarNecesidadesInput) {
        cargarNecesidadesBtn.addEventListener('click', () => cargarNecesidadesInput.click());
        cargarNecesidadesInput.addEventListener('change', cargarNecesidadesTXT);
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
window.guardarNecesidadesTXT = guardarNecesidadesTXT;
window.cargarNecesidadesTXT = cargarNecesidadesTXT;
window.construirContenidoTXT = construirContenidoTXT;
window.aplicarContenidoTXT = aplicarContenidoTXT;