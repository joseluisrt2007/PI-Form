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
 * Obtiene los números de concepto que tienen contenido
 * @returns {Array} Array con los números de concepto que existen
 */
function obtenerConceptosExistentes() {
    const conceptos = [];
    for (let conc = 1; conc <= 5; conc++) {
        const concepto = data[`concepto${conc}`] || '';
        if (concepto.trim() !== '') {
            conceptos.push(conc);
        }
    }
    return conceptos;
}

/**
 * Genera la sección con la lista de ideas
 */
function generarSeccionIdeas() {
    const conceptosExistentes = obtenerConceptosExistentes();
    
    if (conceptosExistentes.length === 0) {
        return '';
    }
    
    let html = `
        <div class="ideas-section">
            <div class="section-title" data-i18n="ideas_concepts">Ideas</div>
            <div class="ideas-list">
                <ul>
    `;
    
    // Listar todas las ideas
    conceptosExistentes.forEach(conc => {
        const idea = data[`concepto${conc}`] || `Idea ${conc}`;
        html += `<li>${idea}</li>`;
    });
    
    html += `
                </ul>
            </div>
        </div>
    `;
    
    return html;
}

/**
 * Obtiene las opciones seleccionadas para un concepto formado específico
 * @param {number} col - Número de la columna (1-3)
 * @returns {Array} Array de opciones seleccionadas
 */
function obtenerOpcionesSeleccionadas(col) {
    const conceptosExistentes = obtenerConceptosExistentes();
    const opcionesSeleccionadas = [];
    
    for (const conc of conceptosExistentes) {
        // Obtener la selección para esta columna
        const grupoKey = `pastel_grupo${(conc - 1) * 3 + col}`;
        const opcionSeleccionada = data[grupoKey] || '';
        
        // Si hay opción seleccionada, agregarla a la lista
        if (opcionSeleccionada.trim() !== '') {
            opcionesSeleccionadas.push(opcionSeleccionada);
        }
    }
    
    return opcionesSeleccionadas;
}

/**
 * Genera las 3 tablas de evaluación de conceptos formados
 */
function generarTablas() {
    if (!tablasContainer) return;
    
    tablasContainer.innerHTML = '';
    
    const conceptosExistentes = obtenerConceptosExistentes();
    
    // Si no hay conceptos originales, mostrar mensaje
    if (conceptosExistentes.length === 0) {
        const message = document.createElement('div');
        message.className = 'no-conceptos-message';
        message.textContent = 'No hay conceptos definidos. Regresa a la página anterior para ingresar conceptos.';
        tablasContainer.appendChild(message);
        return;
    }
    
    // Sección 1: Lista de ideas
    const ideasHTML = generarSeccionIdeas();
    tablasContainer.innerHTML = ideasHTML;
    
    // Sección 2: Los 3 conceptos formados con sus opciones seleccionadas
    for (let col = 1; col <= 3; col++) {
        const section = document.createElement('div');
        section.className = 'concepto-section';

        // Obtener SOLO las opciones seleccionadas para este concepto formado
        const opcionesSeleccionadas = obtenerOpcionesSeleccionadas(col);

        // Obtener texto traducido para el título
        const titleText = (typeof t === 'function') 
            ? `${t('concept_formed') || 'Concepto formado'} ${col}` 
            : `Concepto formado ${col}`;
        
        // Generar lista SOLO de opciones seleccionadas
        let opcionesHTML = '';
        if (opcionesSeleccionadas.length > 0) {
            opcionesHTML = opcionesSeleccionadas.map(opcion => `<li>${opcion}</li>`).join('');
        } else {
            opcionesHTML = `<li><em>${typeof t === 'function' ? t('no_selection') : 'Sin selección'}</em></li>`;
        }
        
        section.innerHTML = `
            <div class="concepto-title">${titleText}</div>
            <div class="opciones-list">
                <strong data-i18n="options_forming_concept">Opciones seleccionadas:</strong>
                <ul>${opcionesHTML}</ul>
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
                    ${[1, 2, 3, 4, 5].map(i => {
                        const criterioIndex = i;
                        const dataKey = `ca${(col - 1) * 5 + i}`;
                        const savedValue = data[dataKey] || '';
                        const criterioText = data[`criterio${criterioIndex}`] || 
                            ((typeof t === 'function') ? `${t('criteria') || 'Criterio'} ${criterioIndex}` : `Criterio ${criterioIndex}`);
                        
                        const placeholderText = (typeof t === 'function') 
                            ? t('enter_rating') || 'Ingresa calificación' 
                            : 'Ingresa calificación';
                        
                        return `
                            <tr>
                                <td>${criterioIndex}</td>
                                <td>${criterioText}</td>
                                <td>
                                    <input type="number" class="calif" data-conc="${col}" data-crit="${criterioIndex}" 
                                           min="0" max="10" step="0.1" value="${savedValue}" 
                                           placeholder="${placeholderText}" data-i18n-placeholder="enter_rating">
                                </td>
                                <td>${i === 1 ? `<span class="resultado" id="res${col}">-</span>` : ''}</td> <!-- Cambiado a "-" -->
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            <button class="btn-calc" onclick="calcular(${col})" data-i18n="calculate">Calcular</button>
        `;
        tablasContainer.appendChild(section);
    }
    
    // Aplicar todas las traducciones
    aplicarTraduccionesCompletas();
    
    // Recalcular si hay datos existentes
    recalcularTodo();
    
    // Validar estado inicial
    validateAll();
    
    // Añadir event listeners a los inputs
    document.querySelectorAll('.calif').forEach(input => {
        input.addEventListener('input', function() {
            // Marcar el concepto como no calculado si se modifica algún campo
            const conc = this.dataset.conc;
            if (conc && data[`calculadoFormado${conc}`]) {
                data[`calculadoFormado${conc}`] = false;
                data[`resultado${parseInt(conc) + 3}`] = null;
                const resultElement = document.getElementById(`res${conc}`);
                if (resultElement) {
                    resultElement.textContent = '-';
                }
            }
            validateAll();
        });
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
    
    // Aplicar traducciones a título de ideas
    document.querySelectorAll('.section-title[data-i18n]').forEach(title => {
        const key = title.getAttribute('data-i18n');
        if (typeof t === 'function') {
            title.textContent = t(key) || title.textContent;
        }
    });
    
    // Actualizar textos "Sin selección" en las listas
    document.querySelectorAll('.opciones-list li em').forEach(em => {
        if (typeof t === 'function' && em.textContent === 'Sin selección') {
            em.textContent = t('no_selection');
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
 * @param {number} conc - Número del concepto formado (1-3)
 */
function calcular(conc) {
    let total = 0;
    let valid = true;
    
    // Primero verificar que todos los campos tengan valor, establecer a 0 si están vacíos
    for (let i = 1; i <= 5; i++) {
        const input = document.querySelector(`input[data-conc="${conc}"][data-crit="${i}"]`);
        if (!input) continue;
        
        // Si el campo está vacío, establecerlo a 0 automáticamente
        if (input.value === '') {
            input.value = '0';
            const dataKey = `ca${(parseInt(conc) - 1) * 5 + i}`;
            data[dataKey] = '0';
        }
        
        const calif = parseFloat(input.value);
        const peso = parseFloat(data[`peso${i}`]) || 0;
        
        if (isNaN(calif) || calif < 0 || calif > 10) {
            valid = false;
        }
        
        total += calif * peso;
        
        // Guardar el valor actualizado en data
        const dataKey = `ca${(parseInt(conc) - 1) * 5 + i}`;
        data[dataKey] = input.value;
    }
    
    const resultElement = document.getElementById(`res${conc}`);
    if (resultElement) {
        if (valid) {
            const resultado = total.toFixed(2);
            resultElement.textContent = resultado;
            // Guardar resultado en datos (conceptos formados 1-3 se guardan como resultado4, resultado5, resultado6)
            data[`resultado${conc + 3}`] = resultado;
            data[`calculadoFormado${conc}`] = true; // Marcar como calculado
        } else {
            alertT('error_ratings_range');
            data[`calculadoFormado${conc}`] = false; // Marcar como no calculado
        }
    }
    
    validateAll();
}

/**
 * Verifica si todos los conceptos formados han sido calculados
 * @returns {boolean} True si todos los conceptos han sido calculados
 */
function todosCalculados() {
    // Siempre hay 3 conceptos formados para evaluar
    const totalConceptosFormados = 3;
    let calculados = 0;
    
    for (let conc = 1; conc <= totalConceptosFormados; conc++) {
        // Verificar si el concepto formado tiene un resultado calculado
        if (data[`calculadoFormado${conc}`]) {
            calculados++;
        }
    }
    
    return calculados === totalConceptosFormados;
}

/**
 * Recalcula todos los conceptos automáticamente si tienen datos existentes
 */
function recalcularTodo() {
    for (let conc = 1; conc <= 3; conc++) {
        // Si ya hay un resultado guardado, mostrarlo
        const resultadoGuardado = data[`resultado${conc + 3}`];
        const resultElement = document.getElementById(`res${conc}`);
        
        if (resultadoGuardado && resultElement) {
            resultElement.textContent = resultadoGuardado;
            data[`calculadoFormado${conc}`] = true;
        } else if (resultElement) {
            // Si no hay resultado, mostrar "-"
            resultElement.textContent = '-';
        }
        
        // Verificar si hay calificaciones guardadas para este concepto formado
        let hasSavedData = false;
        for (let i = 1; i <= 5; i++) {
            const dataKey = `ca${(conc - 1) * 5 + i}`;
            if (data[dataKey] !== undefined) {
                hasSavedData = true;
                break;
            }
        }
        
        // Si hay datos guardados, cargarlos en los inputs
        if (hasSavedData) {
            for (let i = 1; i <= 5; i++) {
                const dataKey = `ca${(conc - 1) * 5 + i}`;
                const input = document.querySelector(`input[data-conc="${conc}"][data-crit="${i}"]`);
                if (input && data[dataKey] !== undefined) {
                    input.value = data[dataKey];
                }
            }
            
            // Si ya estaba calculado, mantener el cálculo
            if (data[`calculadoFormado${conc}`]) {
                // Ya mostramos el resultado arriba
            }
        }
    }
}

/**
 * Valida que todas las calificaciones sean válidas y que todos los conceptos hayan sido calculados
 */
function validateAll() {
    if (!guardarBtn || !errorMsg) return;
    
    let allValid = true;
    let allCalculated = todosCalculados();
    
    // Verificar que las calificaciones existentes sean válidas
    document.querySelectorAll('.calif').forEach(input => {
        if (input.value !== '') { // Solo validar si no está vacío
            const val = parseFloat(input.value);
            if (isNaN(val) || val < 0 || val > 10) {
                allValid = false;
            }
        }
    });
    
    // El botón se habilita solo si todos los conceptos han sido calculados
    // y las calificaciones existentes son válidas
    guardarBtn.disabled = !(allValid && allCalculated);
    
    if (errorMsg) {
        if (allValid && allCalculated) {
            errorMsg.textContent = '';
        } else if (!allValid) {
            errorMsg.textContent = (typeof t === 'function') 
                ? t('error_ratings') 
                : 'Las calificaciones deben estar entre 0 y 10';
        } else if (!allCalculated) {
            errorMsg.textContent = (typeof t === 'function')
                ? t('error_calculate_all') || 'Debes calcular todos los conceptos antes de continuar'
                : 'Debes calcular todos los conceptos antes de continuar';
        }
    }
}

/**
 * Guarda los datos y navega a la siguiente página
 */
function saveAndContinue() {
    // Primero verificar que todos los conceptos hayan sido calculados
    if (!todosCalculados()) {
        const errorMsgText = (typeof t === 'function')
            ? t('error_calculate_all') || 'Debes calcular todos los conceptos antes de continuar'
            : 'Debes calcular todos los conceptos antes de continuar';
        alert(errorMsgText);
        return;
    }
    
    // Guardar todas las calificaciones actuales
    document.querySelectorAll('.calif').forEach(input => {
        const conc = input.dataset.conc;
        const crit = input.dataset.crit;
        if (conc && crit) {
            // Si un campo está vacío (no debería pasar si ya se calcularon), guardar como 0
            const value = input.value === '' ? '0' : input.value;
            const dataKey = `ca${(parseInt(conc) - 1) * 5 + parseInt(crit)}`;
            data[dataKey] = value;
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
window.obtenerConceptosExistentes = obtenerConceptosExistentes;
window.obtenerOpcionesSeleccionadas = obtenerOpcionesSeleccionadas;
window.todosCalculados = todosCalculados;