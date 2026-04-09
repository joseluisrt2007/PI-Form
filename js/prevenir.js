// ========== VARIABLES GLOBALES ==========
const data = JSON.parse(localStorage.getItem('projectData') || '{}');
const mejorConceptoContainer = document.getElementById('mejorConceptoContainer');
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
 * Genera todo el contenido de la página
 */
function generarContenido() {
    generarMejorConcepto();
    generarTablasPrevencion();
    
    // SIN RESTRICCIONES: Asegurar que los botones estén habilitados
    if (guardarBtn) {
        guardarBtn.disabled = false;
    }
    if (continuarBtn) {
        continuarBtn.disabled = false;
    }
}

/**
 * Genera la sección del mejor concepto
 */
function generarMejorConcepto() {
    if (!mejorConceptoContainer) return;
    
    const resultados = [4, 5, 6].map(n => parseFloat(data[`resultado${n}`]) || 0);
    let mejorIdx = resultados.indexOf(Math.max(...resultados));
    if (resultados.every(r => r === 0)) mejorIdx = -1;
    
    const conceptosExistentes = obtenerConceptosExistentes();
    
    let mejorConceptoTexto;
    if (mejorIdx >= 0) {
        const conceptFormedText = (typeof t === 'function') 
            ? t('concept_formed') || 'Concepto formado' 
            : 'Concepto formado';
        mejorConceptoTexto = `${conceptFormedText} ${mejorIdx + 1}`;
    } else {
        mejorConceptoTexto = (typeof t === 'function') 
            ? t('no_concept_selected') || 'No se ha seleccionado concepto' 
            : 'No se ha seleccionado concepto';
    }

    const opciones = [];
    if (mejorIdx >= 0 && conceptosExistentes.length > 0) {
        for (const conc of conceptosExistentes) {
            const key = `pastel_grupo${(conc - 1) * 3 + (mejorIdx + 1)}`;
            const noSelectionText = (typeof t === 'function') 
                ? t('no_selection') || 'Sin selección' 
                : 'Sin selección';
            
            const opcionSeleccionada = data[key] || '';
            const nombreConcepto = data[`concepto${conc}`];
            
            let opcionText = '';
            let encontrado = false;
            
            for (let opcionNum = 1; opcionNum <= 3; opcionNum++) {
                const posIdx = (conc - 1) * 3 + opcionNum;
                const posibilidad = data[`pos${posIdx}`] || '';
                
                if (posibilidad === opcionSeleccionada) {
                    opcionText = `<strong>${nombreConcepto}</strong> ${posibilidad}`;
                    encontrado = true;
                    break;
                }
            }
            
            if (!encontrado) {
                opcionText = `<strong>${nombreConcepto}</strong> <em>${noSelectionText}</em>`;
            }
            
            opciones.push(opcionText);
        }
    }

    const titulo = (typeof t === 'function') ? t('best_concept') || 'Mejor concepto' : 'Mejor concepto';
    mejorConceptoContainer.innerHTML = `
        <div class="mejor-concepto">
            ${titulo}: ${mejorConceptoTexto}
        </div>
        ${mejorIdx >= 0 && opciones.length > 0 ? `
            <div class="opciones-list">
                <strong>${(typeof t === 'function') ? t('concept_composition') || 'Composición del concepto' : 'Composición del concepto'}</strong>
                <ul>
                    ${opciones.map(opcion => `<li>${opcion}</li>`).join('')}
                </ul>
            </div>
        ` : ''}
    `;
    
    if (typeof t === 'function') {
        mejorConceptoContainer.querySelectorAll('em').forEach(em => {
            if (em.textContent === 'Sin selección') {
                em.textContent = t('no_selection');
            }
        });
    }
}

/**
 * Genera las 3 tablas de prevención
 */
function generarTablasPrevencion() {
    if (!tablasContainer) return;
    
    tablasContainer.innerHTML = '';
    
    for (let tabla = 1; tabla <= 3; tabla++) {
        const section = document.createElement('div');
        section.className = 'tabla-prevencion';
        
        const preventionText = (typeof t === 'function') 
            ? t('prevention') || 'Prevención' 
            : 'Prevención';
        
        const getTranslatedText = (key) => {
            return (typeof t === 'function') ? t(key) || key : key;
        };
        
        const getPlaceholder = (key) => {
            const translations = {
                'enter_task': 'Ingresa información',
                'enter_severity': '1-10',
                'enter_occurrence': '1-10',
                'enter_responsible': 'Responsable'
            };
            return (typeof t === 'function') ? t(key) || translations[key] : translations[key];
        };
        
        section.innerHTML = `
            <div class="tabla-title">${preventionText} ${tabla}</div>
            <table>
                <tr>
                    <th>${getTranslatedText('potential_failure')}</th>
                    <td>
                        <input type="text" data-key="fallaPotencial${tabla}" 
                               value="${data[`fallaPotencial${tabla}`] || ''}" 
                               placeholder="${getPlaceholder('enter_task')}">
                    </td>
                </tr>
                <tr>
                    <th>${getTranslatedText('effect')}</th>
                    <td>
                        <input type="text" data-key="efecto${tabla}" 
                               value="${data[`efecto${tabla}`] || ''}" 
                               placeholder="${getPlaceholder('enter_task')}">
                    </td>
                </tr>
                <tr>
                    <th>${getTranslatedText('severity')}</th>
                    <td>
                        <input type="number" class="sev" data-tabla="${tabla}" 
                               min="1" max="10" step="1" 
                               value="${data[`sev${tabla}`] || ''}" 
                               placeholder="${getPlaceholder('enter_severity')}">
                    </td>
                </tr>
                <tr>
                    <th>${getTranslatedText('occurrence')}</th>
                    <td>
                        <input type="number" class="ocu" data-tabla="${tabla}" 
                               min="1" max="10" step="1" 
                               value="${data[`ocu${tabla}`] || ''}" 
                               placeholder="${getPlaceholder('enter_occurrence')}">
                    </td>
                </tr>
                <tr>
                    <th>${getTranslatedText('risk')}</th>
                    <td class="riesgo-cell">
                        <span class="riesgo" id="riesgo${tabla}">${data[`riesgo${tabla}`] || '0.00'}</span>
                    </td>
                </tr>
                <tr>
                    <th>${getTranslatedText('actions_to_take')}</th>
                    <td>
                        <input type="text" data-key="accionReal${tabla}" 
                               value="${data[`accionReal${tabla}`] || ''}" 
                               placeholder="${getPlaceholder('enter_task')}">
                    </td>
                </tr>
                <tr>
                    <th>${getTranslatedText('responsible')}</th>
                    <td>
                        <input type="text" data-key="responsable${tabla}" 
                               value="${data[`responsable${tabla}`] || ''}" 
                               placeholder="${getPlaceholder('enter_responsible')}">
                    </td>
                </tr>
                <tr>
                    <th>${getTranslatedText('today_date')}</th>
                    <td>
                        <input type="date" data-key="fechaCell${tabla}" 
                               value="${data[`fechaCell${tabla}`] || new Date().toISOString().split('T')[0]}">
                    </td>
                </tr>
                <tr>
                    <th>${getTranslatedText('action_taken')}</th>
                    <td>
                        <input type="text" data-key="accionTom${tabla}" 
                               value="${data[`accionTom${tabla}`] || ''}" 
                               placeholder="${getPlaceholder('enter_task')}">
                    </td>
                </tr>
                <tr>
                    <th>${getTranslatedText('action_date')}</th>
                    <td>
                        <input type="date" data-key="fecha${tabla}" 
                               value="${data[`fecha${tabla}`] || ''}">
                    </td>
                </tr>
            </table>
            <button class="btn-calc" onclick="calcularRiesgo(${tabla})">
                ${getTranslatedText('risk_calculation')}
            </button>
        `;
        tablasContainer.appendChild(section);
    }
    
    recalcularRiesgosSiExisten();
}

/**
 * Calcula el riesgo - SIN RESTRICCIONES
 * @param {number} tabla - Número de tabla (1-3)
 */
function calcularRiesgo(tabla) {
    const sevInput = document.querySelector(`.sev[data-tabla="${tabla}"]`);
    const ocuInput = document.querySelector(`.ocu[data-tabla="${tabla}"]`);
    
    if (!sevInput || !ocuInput) return;
    
    let sev = parseFloat(sevInput.value);
    let ocu = parseFloat(ocuInput.value);
    
    if (isNaN(sev)) sev = 0;
    if (isNaN(ocu)) ocu = 0;
    
    const riesgo = (sev * ocu).toFixed(2);
    const riesgoElement = document.getElementById(`riesgo${tabla}`);
    if (riesgoElement) {
        riesgoElement.textContent = riesgo;
        data[`riesgo${tabla}`] = riesgo;
    }
}

/**
 * Recalcula riesgos al cargar si hay datos existentes
 */
function recalcularRiesgosSiExisten() {
    for (let tabla = 1; tabla <= 3; tabla++) {
        const sevInput = document.querySelector(`.sev[data-tabla="${tabla}"]`);
        const ocuInput = document.querySelector(`.ocu[data-tabla="${tabla}"]`);
        if (sevInput && sevInput.value && ocuInput && ocuInput.value) {
            calcularRiesgo(tabla);
        }
    }
}

/**
 * SOLO GUARDA los datos en localStorage (sin navegar)
 */
function saveData() {
    document.querySelectorAll('input[data-key]').forEach(input => {
        if (input.dataset.key) {
            data[input.dataset.key] = input.value;
        }
    });
    
    document.querySelectorAll('.sev').forEach(input => {
        const tabla = input.dataset.tabla;
        if (tabla) {
            data[`sev${tabla}`] = input.value;
        }
    });
    
    document.querySelectorAll('.ocu').forEach(input => {
        const tabla = input.dataset.tabla;
        if (tabla) {
            data[`ocu${tabla}`] = input.value;
        }
    });
    
    localStorage.setItem('projectData', JSON.stringify(data));
    console.log('Datos guardados correctamente');
}

/**
 * SOLO NAVEGA a la siguiente página (sin guardar)
 */
function continueToNext() {
    window.location.href = 'diagrama.html';
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
            generarContenido();
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
    generarContenido();
    
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
window.generarContenido = generarContenido;
window.generarMejorConcepto = generarMejorConcepto;
window.generarTablasPrevencion = generarTablasPrevencion;
window.calcularRiesgo = calcularRiesgo;
window.recalcularRiesgosSiExisten = recalcularRiesgosSiExisten;
window.saveData = saveData;
window.continueToNext = continueToNext;
window.obtenerConceptosExistentes = obtenerConceptosExistentes;