// ========== VARIABLES GLOBALES ==========
const data = JSON.parse(localStorage.getItem('projectData') || '{}');
const tablasContainer = document.getElementById('tablasContainer');
const guardarBtn = document.getElementById('guardarBtn');
const errorMsg = document.getElementById('errorMsg');

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
        // Usar traducción para "(Sin nombre)"
        if (typeof t === 'function') {
            projectText.textContent = t('unnamed_project') || '(Sin nombre)';
        } else {
            projectText.textContent = '(Sin nombre)';
        }
    }
}

/**
 * Genera las 3 tablas de evaluación de conceptos formados
 */
function generarTablas() {
    if (!tablasContainer) return;
    
    tablasContainer.innerHTML = '';
    
    for (let conc = 1; conc <= 3; conc++) {
        const section = document.createElement('div');
        section.className = 'concepto-section';

        // Obtener las 5 opciones del concepto formado
        const indices = [];
        for (let g = 1; g <= 5; g++) {
            const grupoKey = `pastel_grupo${(g - 1) * 3 + conc}`;
            const selectedPos = data[grupoKey] || (typeof t === 'function' ? t('no_selection') : 'Sin selección');
            indices.push(selectedPos);
        }

        // Obtener texto traducido para el título
        const titleText = (typeof t === 'function') 
            ? `${t('concept_formed') || 'Concepto formado'} ${conc}` 
            : `Concepto formado ${conc}`;
        
        section.innerHTML = `
            <div class="concepto-title">${titleText}</div>
            <div class="opciones-list">
                <strong data-i18n="options_forming_concept">Opciones que componen este concepto:</strong>
                <ul>
                    <li>${indices[0]}</li>
                    <li>${indices[1]}</li>
                    <li>${indices[2]}</li>
                    <li>${indices[3]}</li>
                    <li>${indices[4]}</li>
                </ul>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th data-i18n="criteria">Criterio</th>
                        <th data-i18n="rating">Calificación (0-10)</th>
                        <th data-i18n="result">Resultado</th>
                    </tr>
                </thead>
                <tbody>
                    ${[1, 2, 3, 4].map(i => {
                        const dataKey = `ca${(conc - 1) * 4 + i}`;
                        const savedValue = data[dataKey] || '';
                        const criterioText = data[`criterio${i}`] || 
                            ((typeof t === 'function') ? `${t('criteria') || 'Criterio'} ${i}` : `Criterio ${i}`);
                        
                        const placeholderText = (typeof t === 'function') 
                            ? t('enter_rating') || 'Ingresa calificación' 
                            : 'Ingresa calificación';
                        
                        return `
                            <tr>
                                <td>${i}</td>
                                <td>${criterioText}</td>
                                <td>
                                    <input type="number" class="calif" data-conc="${conc}" data-crit="${i}" 
                                           min="0" max="10" step="0.1" value="${savedValue}" 
                                           placeholder="${placeholderText}" data-i18n-placeholder="enter_rating">
                                </td>
                                <td>${i === 1 ? `<span class="resultado" id="res${conc}">0.00</span>` : ''}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            <button class="btn-calc" onclick="calcular(${conc})" data-i18n="calculate">Calcular</button>
        `;
        tablasContainer.appendChild(section);
    }
    
    // Aplicar todas las traducciones
    aplicarTraduccionesCompletas();
    
    // Recalcular si hay datos
    recalcularTodo();
    
    // Validar estado inicial
    validateAll();
    
    // Añadir event listeners a los inputs
    document.querySelectorAll('.calif').forEach(input => {
        input.addEventListener('input', validateAll);
    });
}

/**
 * Aplica todas las traducciones a elementos dinámicos
 */
function aplicarTraduccionesCompletas() {
    // Aplicar traducciones a placeholders
    document.querySelectorAll('input[data-i18n-placeholder]').forEach(input => {
        const key = input.getAttribute('data-i18n-placeholder');
        if (typeof t === 'function') {
            input.placeholder = t(key) || input.placeholder;
        }
    });
    
    // Aplicar traducciones a encabezados de tabla
    document.querySelectorAll('thead th[data-i18n]').forEach(th => {
        const key = th.getAttribute('data-i18n');
        if (typeof t === 'function') {
            th.textContent = t(key) || th.textContent;
        }
    });
    
    // Aplicar traducciones a textos fuertes
    document.querySelectorAll('strong[data-i18n]').forEach(strong => {
        const key = strong.getAttribute('data-i18n');
        if (typeof t === 'function') {
            strong.textContent = t(key) || strong.textContent;
        }
    });
    
    // Aplicar traducciones a botones de calcular
    document.querySelectorAll('.btn-calc').forEach(btn => {
        if (typeof t === 'function') {
            btn.textContent = t('calculate') || 'Calcular';
        }
    });
    
    // Aplicar traducciones a títulos de concepto
    document.querySelectorAll('.concepto-title').forEach((title, index) => {
        if (typeof t === 'function') {
            title.textContent = `${t('concept_formed') || 'Concepto formado'} ${index + 1}`;
        }
    });
    
    // Actualizar textos "Sin selección" en las listas
    document.querySelectorAll('.opciones-list li').forEach(li => {
        if (typeof t === 'function' && li.textContent === t('no_selection')) {
            li.textContent = t('no_selection');
        }
    });
}

/**
 * Muestra una alerta con texto traducido
 * @param {string} key - Clave de traducción
 */
function alertT(key) {
    const message = (typeof t === 'function') ? t(key) : key;
    alert(message);
}

/**
 * Calcula el resultado de un concepto específico
 * @param {number} conc - Número del concepto (1-3)
 */
function calcular(conc) {
    let total = 0;
    let valid = true;
    
    for (let i = 1; i <= 4; i++) {
        const input = document.querySelector(`input[data-conc="${conc}"][data-crit="${i}"]`);
        if (!input) continue;
        
        const calif = parseFloat(input.value) || 0;
        const peso = parseFloat(data[`peso${i}`]) || 0;
        
        if (isNaN(calif) || calif < 0 || calif > 10) {
            valid = false;
        }
        
        total += calif * peso;
    }
    
    const resultElement = document.getElementById(`res${conc}`);
    if (resultElement) {
        if (valid) {
            resultElement.textContent = total.toFixed(2);
            data[`resultado${conc + 3}`] = total.toFixed(2);  // resultado4,5,6
        } else {
            alertT('error_ratings_range');
        }
    }
    
    validateAll();
}

/**
 * Recalcula todos los conceptos automáticamente si tienen datos
 */
function recalcularTodo() {
    for (let conc = 1; conc <= 3; conc++) {
        let hasData = false;
        
        for (let i = 1; i <= 4; i++) {
            const input = document.querySelector(`input[data-conc="${conc}"][data-crit="${i}"]`);
            if (input && input.value !== '') {
                hasData = true;
                break;
            }
        }
        
        if (hasData) {
            calcular(conc);
        }
    }
}

/**
 * Valida que todas las calificaciones sean válidas
 */
function validateAll() {
    if (!guardarBtn || !errorMsg) return;
    
    let allValid = true;
    
    document.querySelectorAll('.calif').forEach(input => {
        const val = parseFloat(input.value);
        if (isNaN(val) || val < 0 || val > 10 || input.value === '') {
            allValid = false;
        }
    });
    
    guardarBtn.disabled = !allValid;
    
    if (errorMsg) {
        if (allValid) {
            errorMsg.textContent = '';
        } else {
            errorMsg.textContent = (typeof t === 'function') 
                ? t('error_ratings') 
                : 'Completa todas las calificaciones (0-10)';
        }
    }
}

/**
 * Guarda los datos y navega a la siguiente página
 */
function saveAndContinue() {
    if (!guardarBtn) return;
    
    // Guardar todas las calificaciones
    document.querySelectorAll('.calif').forEach(input => {
        const conc = input.dataset.conc;
        const crit = input.dataset.crit;
        if (conc && crit) {
            const dataKey = `ca${(parseInt(conc) - 1) * 4 + parseInt(crit)}`;
            data[dataKey] = input.value;
        }
    });
    
    // Guardar en localStorage
    localStorage.setItem('projectData', JSON.stringify(data));
    
    // Navegar a la siguiente página
    window.location.href = 'prevenir.html';
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
            // Regenerar tablas para aplicar traducciones
            generarTablas();
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

/**
 * Configura el botón de guardar
 */
function setupSaveButton() {
    if (guardarBtn) {
        guardarBtn.addEventListener('click', saveAndContinue);
    }
}

/**
 * Inicializa la página
 */
function initializePage() {
    // Configurar componentes
    setupLanguageSelector();
    setupThemeToggle();
    setupSaveButton();
    
    // Actualizar UI
    updateProjectName();
    generarTablas();
}

// ========== EJECUCIÓN AL CARGAR EL DOM ==========
document.addEventListener('DOMContentLoaded', initializePage);

// ========== EXPORTAR FUNCIONES PARA USO GLOBAL ==========
window.updateProjectName = updateProjectName;
window.generarTablas = generarTablas;
window.aplicarTraduccionesCompletas = aplicarTraduccionesCompletas;
window.alertT = alertT;
window.calcular = calcular;
window.recalcularTodo = recalcularTodo;
window.validateAll = validateAll;
window.saveAndContinue = saveAndContinue;