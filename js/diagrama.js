// ========== VARIABLES GLOBALES ==========
const data = JSON.parse(localStorage.getItem('projectData') || '{}');
const mejorConceptoContainer = document.getElementById('mejorConceptoContainer');
const tareasContainer = document.getElementById('tareasContainer');
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
    generarTareas();
    aplicarTraduccionesEtiquetas();
    
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

    const bestConceptText = (typeof t === 'function') 
        ? t('best_concept') || 'Mejor concepto' 
        : 'Mejor concepto';
    
    const compositionText = (typeof t === 'function') 
        ? t('concept_composition') || 'Composición del concepto' 
        : 'Composición del concepto';

    mejorConceptoContainer.innerHTML = `
        <div class="mejor-concepto">
            ${bestConceptText}: ${mejorConceptoTexto}
        </div>
        ${mejorIdx >= 0 && opciones.length > 0 ? `
            <div class="opciones-list">
                <strong>${compositionText}</strong>
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
 * Genera las 15 filas de tareas con responsables
 */
function generarTareas() {
    if (!tareasContainer) return;
    
    tareasContainer.innerHTML = '';
    
    const responsableLabel = (typeof t === 'function') 
        ? t('responsable_label') || 'Responsable' 
        : 'Responsable';
    
    const taskLabel = (typeof t === 'function') 
        ? t('task_label') || 'Tarea' 
        : 'Tarea';
    
    const salidaLabel = (typeof t === 'function') 
        ? t('salida_label') || 'Salida' 
        : 'Salida';
    
    const responsablePlaceholder = (typeof t === 'function') 
        ? t('enter_responsible') || 'Ingresa responsable' 
        : 'Ingresa responsable';
    
    const taskPlaceholder = (typeof t === 'function') 
        ? t('enter_task') || 'Describe la tarea' 
        : 'Describe la tarea';
    
    const salidaPlaceholder = (typeof t === 'function') 
        ? t('enter_salida') || 'Describe la salida' 
        : 'Describe la salida';
    
    for (let i = 1; i <= 15; i++) {
        const responsable = data[`persona${i}`] || '';
        const tarea = data[`tarea${i}`] || '';
        const salida = data[`salida${i}`] || '';

        const tareaDiv = document.createElement('div');
        tareaDiv.className = 'tarea-row';
        tareaDiv.innerHTML = `
            <div class="responsable">
                <label>${responsableLabel}</label>
                <input type="text" value="${responsable}" 
                       data-key="persona${i}" 
                       placeholder="${responsablePlaceholder}">
            </div>
            <div class="tarea">
                <label>${taskLabel}</label>
                <input type="text" value="${tarea}" 
                       data-key="tarea${i}" 
                       placeholder="${taskPlaceholder}">
            </div>
            <div class="salida">
                <label>${salidaLabel}</label>
                <input type="text" value="${salida}" 
                       data-key="salida${i}" 
                       placeholder="${salidaPlaceholder}">
            </div>
        `;
        tareasContainer.appendChild(tareaDiv);
    }
}

/**
 * Aplica traducciones a elementos específicos de la página
 */
function aplicarTraduccionesEtiquetas() {
    const tituloTabla = document.querySelector('.tabla-tareas h2');
    if (tituloTabla && tituloTabla.hasAttribute('data-i18n')) {
        const key = tituloTabla.getAttribute('data-i18n');
        if (typeof t === 'function') {
            tituloTabla.textContent = t(key) || tituloTabla.textContent;
        }
    }
    
    const tituloPrincipal = document.querySelector('.container h1');
    if (tituloPrincipal && tituloPrincipal.hasAttribute('data-i18n')) {
        const key = tituloPrincipal.getAttribute('data-i18n');
        if (typeof t === 'function') {
            tituloPrincipal.textContent = t(key) || tituloPrincipal.textContent;
        }
    }
}

/**
 * SOLO GUARDA los datos en localStorage (sin navegar)
 */
function saveData() {
    document.querySelectorAll('input[data-key]').forEach(input => {
        if (input.dataset.key) {
            data[input.dataset.key] = input.value.trim();
        }
    });
    
    localStorage.setItem('projectData', JSON.stringify(data));
    console.log('Datos guardados correctamente');
}

/**
 * SOLO NAVEGA a la siguiente página (sin guardar)
 */
function continueToNext() {
    window.location.href = 'diagrama2.html';
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
window.generarTareas = generarTareas;
window.aplicarTraduccionesEtiquetas = aplicarTraduccionesEtiquetas;
window.saveData = saveData;
window.continueToNext = continueToNext;
window.obtenerConceptosExistentes = obtenerConceptosExistentes;