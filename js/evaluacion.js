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
 * Cuenta cuántos conceptos tienen contenido
 * @returns {number} Número de conceptos con contenido
 */
function contarConceptos() {
    let contador = 0;
    for (let conc = 1; conc <= 5; conc++) {
        const concepto = data[`concepto${conc}`] || '';
        if (concepto.trim() !== '') {
            contador++;
        }
    }
    return contador;
}

/**
 * Genera las tablas de evaluación según los conceptos llenados
 */
function generarTablas() {
    if (!tablasContainer) return;
    
    tablasContainer.innerHTML = '';
    
    const numeroDeConceptos = contarConceptos();
    
    // Si no hay conceptos, mostrar mensaje
    if (numeroDeConceptos === 0) {
        const message = document.createElement('div');
        message.className = 'no-conceptos-message';
        message.textContent = 'No hay conceptos definidos. Regresa a la página anterior para ingresar conceptos.';
        tablasContainer.appendChild(message);
        return;
    }
    
    for (let conc = 1; conc <= 5; conc++) {
        const conceptoNombre = data[`concepto${conc}`] || '';
        
        // Solo crear tabla si el concepto tiene contenido
        if (conceptoNombre.trim() === '') {
            continue;
        }
        
        const section = document.createElement('div');
        section.className = 'concepto-section';
        section.innerHTML = `
            <div class="concepto-title">${conceptoNombre}</div>
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
                    ${[1, 2, 3, 4, 5].map(i => `  <!-- CAMBIADO: Ahora incluye el 5 -->
                        <tr>
                            <td>${i}</td>
                            <td>${data[`criterio${i}`] || `Criterio ${i}`}</td>
                            <td>
                                <input type="number" class="calif" data-conc="${conc}" data-crit="${i}" 
                                       min="0" max="10" step="0.1" 
                                       value="${data[`calif${conc}_${i}`] || ''}"> <!-- Mantenemos vacío por defecto -->
                            </td>
                            <td>${i === 1 ? `<span class="resultado" id="res${conc}">-</span>` : ''}</td> <!-- Cambiado a "-" -->
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <button class="btn-calc" onclick="calcular(${conc})" data-i18n="calculate">Calcular</button>
        `;
        tablasContainer.appendChild(section);
    }
    
    // Aplicar traducciones dinámicamente
    applyDynamicTranslations();
    
    // Recalcular si hay datos existentes
    recalcularTodo();
    
    // Validar estado inicial
    validateAll();
    
    // Añadir event listeners a los inputs
    document.querySelectorAll('.calif').forEach(input => {
        input.addEventListener('input', function() {
            // Marcar el concepto como no calculado si se modifica algún campo
            const conc = this.dataset.conc;
            if (conc && data[`calculado${conc}`]) {
                data[`calculado${conc}`] = false;
                data[`resultado${conc}`] = null;
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
 * Aplica traducciones a elementos generados dinámicamente
 */
function applyDynamicTranslations() {
    // Aplicar traducciones a los botones de calcular
    document.querySelectorAll('.btn-calc').forEach(btn => {
        if (typeof t === 'function') {
            btn.textContent = t('calculate') || 'Calcular';
        }
    });
    
    // Aplicar traducciones a los encabezados de tabla
    document.querySelectorAll('thead th[data-i18n]').forEach(th => {
        const key = th.getAttribute('data-i18n');
        if (typeof t === 'function') {
            th.textContent = t(key) || th.textContent;
        }
    });
}

/**
 * Calcula el resultado de un concepto específico
 * @param {number} conc - Número del concepto (1-5)
 */
function calcular(conc) {
    let total = 0;
    let valid = true;
    let allFieldsFilled = true;
    
    // Primero verificar que todos los campos tengan valor
    for (let i = 1; i <= 5; i++) {
        const input = document.querySelector(`input[data-conc="${conc}"][data-crit="${i}"]`);
        if (!input) continue;
        
        // Si el campo está vacío, establecerlo a 0 automáticamente
        if (input.value === '') {
            input.value = '0';
            data[`calif${conc}_${i}`] = '0';
        }
        
        const calif = parseFloat(input.value);
        const peso = parseFloat(data[`peso${i}`]) || 0;
        
        if (isNaN(calif) || calif < 0 || calif > 10) {
            valid = false;
        }
        
        total += calif * peso;
        
        // Guardar el valor actualizado en data
        data[`calif${conc}_${i}`] = input.value;
    }
    
    const resultElement = document.getElementById(`res${conc}`);
    if (resultElement) {
        if (valid) {
            const resultado = total.toFixed(2);
            resultElement.textContent = resultado;
            data[`resultado${conc}`] = resultado;
            data[`calculado${conc}`] = true; // Marcar como calculado
        } else {
            // Mostrar mensaje de error usando traducción
            const errorMsg = (typeof t === 'function') 
                ? t('error_ratings_range') 
                : 'Las calificaciones deben estar entre 0 y 10';
            alert(errorMsg);
            data[`calculado${conc}`] = false; // Marcar como no calculado
        }
    }
    
    validateAll();
}

/**
 * Recalcula todos los conceptos automáticamente si tienen datos existentes
 */
function recalcularTodo() {
    for (let conc = 1; conc <= 5; conc++) {
        // Solo recalcular si el concepto existe
        const conceptoNombre = data[`concepto${conc}`] || '';
        if (conceptoNombre.trim() === '') {
            continue;
        }
        
        // Si ya hay un resultado guardado, mostrarlo
        const resultadoGuardado = data[`resultado${conc}`];
        const resultElement = document.getElementById(`res${conc}`);
        
        if (resultadoGuardado && resultElement) {
            resultElement.textContent = resultadoGuardado;
            data[`calculado${conc}`] = true;
        } else if (resultElement) {
            // Si no hay resultado, mostrar "-"
            resultElement.textContent = '-';
        }
        
        // Verificar si hay calificaciones guardadas para este concepto
        let hasSavedData = false;
        for (let i = 1; i <= 5; i++) {
            if (data[`calif${conc}_${i}`] !== undefined) {
                hasSavedData = true;
                break;
            }
        }
        
        // Si hay datos guardados, cargarlos en los inputs
        if (hasSavedData) {
            for (let i = 1; i <= 5; i++) {
                const input = document.querySelector(`input[data-conc="${conc}"][data-crit="${i}"]`);
                if (input && data[`calif${conc}_${i}`] !== undefined) {
                    input.value = data[`calif${conc}_${i}`];
                }
            }
            
            // Si ya estaba calculado, mantener el cálculo
            if (data[`calculado${conc}`]) {
                // Ya mostramos el resultado arriba
            }
        }
    }
}

/**
 * Verifica si todos los conceptos han sido calculados
 * @returns {boolean} True si todos los conceptos han sido calculados
 */
function todosCalculados() {
    const numeroDeConceptos = contarConceptos();
    
    // Si no hay conceptos, no se puede calcular nada
    if (numeroDeConceptos === 0) {
        return false;
    }
    
    let calculados = 0;
    
    for (let conc = 1; conc <= 5; conc++) {
        const conceptoNombre = data[`concepto${conc}`] || '';
        if (conceptoNombre.trim() === '') {
            continue;
        }
        
        // Verificar si el concepto tiene un resultado calculado
        if (data[`calculado${conc}`]) {
            calculados++;
        }
    }
    
    return calculados === numeroDeConceptos;
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
            data[`calif${conc}_${crit}`] = value;
        }
    });
    
    // Guardar en localStorage
    localStorage.setItem('projectData', JSON.stringify(data));
    
    // Navegar a la siguiente página
    window.location.href = 'morfologia.html';
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
window.calcular = calcular;
window.recalcularTodo = recalcularTodo;
window.validateAll = validateAll;
window.saveAndContinue = saveAndContinue;
window.contarConceptos = contarConceptos;
window.todosCalculados = todosCalculados;