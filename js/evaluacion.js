// ========== VARIABLES GLOBALES ==========
const data = JSON.parse(localStorage.getItem('projectData') || '{}');
const tablasContainer = document.getElementById('tablasContainer');
const guardarBtn = document.getElementById('guardarBtn');
const continuarBtn = document.getElementById('continuarBtn');

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
    
    if (numeroDeConceptos === 0) {
        const message = document.createElement('div');
        message.className = 'no-conceptos-message';
        message.textContent = 'No hay conceptos definidos. Regresa a la página anterior para ingresar conceptos.';
        tablasContainer.appendChild(message);
        return;
    }
    
    for (let conc = 1; conc <= 5; conc++) {
        const conceptoNombre = data[`concepto${conc}`] || '';
        
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
                    ${[1, 2, 3, 4, 5].map(i => `
                        <tr>
                            <td>${i}</td>
                            <td>${data[`criterio${i}`] || `Criterio ${i}`}</td>
                            <td>
                                <input type="number" class="calif" data-conc="${conc}" data-crit="${i}" 
                                       min="0" max="10" step="0.1" 
                                       value="${data[`calif${conc}_${i}`] || ''}">
                            </td>
                            <td>${i === 1 ? `<span class="resultado" id="res${conc}">-</span>` : ''}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <button class="btn-calc" onclick="calcular(${conc})" data-i18n="calculate">Calcular</button>
        `;
        tablasContainer.appendChild(section);
    }
    
    applyDynamicTranslations();
    recalcularTodo();
    
    // SIN RESTRICCIONES: Siempre habilitar los botones
    if (guardarBtn) {
        guardarBtn.disabled = false;
    }
    if (continuarBtn) {
        continuarBtn.disabled = false;
    }
    
    document.querySelectorAll('.calif').forEach(input => {
        input.addEventListener('input', function() {
            const conc = this.dataset.conc;
            if (conc && data[`calculado${conc}`]) {
                data[`calculado${conc}`] = false;
                data[`resultado${conc}`] = null;
                const resultElement = document.getElementById(`res${conc}`);
                if (resultElement) {
                    resultElement.textContent = '-';
                }
            }
            // SIN RESTRICCIONES: Siempre habilitar los botones
            if (guardarBtn) {
                guardarBtn.disabled = false;
            }
            if (continuarBtn) {
                continuarBtn.disabled = false;
            }
        });
    });
}

/**
 * Aplica traducciones a elementos generados dinámicamente
 */
function applyDynamicTranslations() {
    document.querySelectorAll('.btn-calc').forEach(btn => {
        if (typeof t === 'function') {
            btn.textContent = t('calculate') || 'Calcular';
        }
    });
    
    document.querySelectorAll('thead th[data-i18n]').forEach(th => {
        const key = th.getAttribute('data-i18n');
        if (typeof t === 'function') {
            th.textContent = t(key) || th.textContent;
        }
    });
}

/**
 * Calcula el resultado de un concepto específico - SIN RESTRICCIONES
 * @param {number} conc - Número del concepto (1-5)
 */
function calcular(conc) {
    let total = 0;
    
    for (let i = 1; i <= 5; i++) {
        const input = document.querySelector(`input[data-conc="${conc}"][data-crit="${i}"]`);
        if (!input) continue;
        
        if (input.value === '') {
            input.value = '0';
            data[`calif${conc}_${i}`] = '0';
        }
        
        const calif = parseFloat(input.value) || 0;
        const peso = parseFloat(data[`peso${i}`]) || 0;
        
        total += calif * peso;
        
        data[`calif${conc}_${i}`] = input.value;
    }
    
    const resultElement = document.getElementById(`res${conc}`);
    if (resultElement) {
        const resultado = total.toFixed(2);
        resultElement.textContent = resultado;
        data[`resultado${conc}`] = resultado;
        data[`calculado${conc}`] = true;
    }
    
    // SIN RESTRICCIONES: Siempre habilitar los botones
    if (guardarBtn) {
        guardarBtn.disabled = false;
    }
    if (continuarBtn) {
        continuarBtn.disabled = false;
    }
}

/**
 * Recalcula todos los conceptos automáticamente si tienen datos existentes
 */
function recalcularTodo() {
    for (let conc = 1; conc <= 5; conc++) {
        const conceptoNombre = data[`concepto${conc}`] || '';
        if (conceptoNombre.trim() === '') {
            continue;
        }
        
        const resultadoGuardado = data[`resultado${conc}`];
        const resultElement = document.getElementById(`res${conc}`);
        
        if (resultadoGuardado && resultElement) {
            resultElement.textContent = resultadoGuardado;
            data[`calculado${conc}`] = true;
        } else if (resultElement) {
            resultElement.textContent = '-';
        }
        
        let hasSavedData = false;
        for (let i = 1; i <= 5; i++) {
            if (data[`calif${conc}_${i}`] !== undefined) {
                hasSavedData = true;
                break;
            }
        }
        
        if (hasSavedData) {
            for (let i = 1; i <= 5; i++) {
                const input = document.querySelector(`input[data-conc="${conc}"][data-crit="${i}"]`);
                if (input && data[`calif${conc}_${i}`] !== undefined) {
                    input.value = data[`calif${conc}_${i}`];
                }
            }
        }
    }
}

/**
 * Verifica si todos los conceptos han sido calculados - Siempre true
 * @returns {boolean} Siempre true
 */
function todosCalculados() {
    return true;
}

/**
 * Valida que todas las calificaciones sean válidas - SIN RESTRICCIONES
 */
function validateAll() {
    if (guardarBtn) {
        guardarBtn.disabled = false;
    }
    if (continuarBtn) {
        continuarBtn.disabled = false;
    }
}

/**
 * SOLO GUARDA los datos en localStorage (sin navegar)
 */
function saveData() {
    document.querySelectorAll('.calif').forEach(input => {
        const conc = input.dataset.conc;
        const crit = input.dataset.crit;
        if (conc && crit) {
            const value = input.value === '' ? '0' : input.value;
            data[`calif${conc}_${crit}`] = value;
        }
    });
    
    localStorage.setItem('projectData', JSON.stringify(data));
    console.log('Datos guardados correctamente');
}

/**
 * SOLO NAVEGA a la siguiente página (sin guardar)
 * MODIFICADO: Ahora va a opcionDiagramas.html
 */
function continueToNext() {
    window.location.href = 'opcionDiagramas.html';
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
 * Configura los botones de Guardar y Continuar
 */
function setupButtons() {
    if (guardarBtn) {
        guardarBtn.addEventListener('click', saveData);
    }
    if (continuarBtn) {
        continuarBtn.addEventListener('click', continueToNext);
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
    generarTablas();
    
    // SIN RESTRICCIONES: Asegurar que los botones estén habilitados
    if (guardarBtn) {
        guardarBtn.disabled = false;
    }
    if (continuarBtn) {
        continuarBtn.disabled = false;
    }
}

// ========== EJECUCIÓN AL CARGAR EL DOM ==========
document.addEventListener('DOMContentLoaded', initializePage);

// ========== EXPORTAR FUNCIONES PARA USO GLOBAL ==========
window.updateProjectName = updateProjectName;
window.generarTablas = generarTablas;
window.calcular = calcular;
window.recalcularTodo = recalcularTodo;
window.validateAll = validateAll;
window.saveData = saveData;
window.continueToNext = continueToNext;
window.contarConceptos = contarConceptos;
window.todosCalculados = todosCalculados;