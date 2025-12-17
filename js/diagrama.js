// ========== VARIABLES GLOBALES ==========
const data = JSON.parse(localStorage.getItem('projectData') || '{}');
const mejorConceptoContainer = document.getElementById('mejorConceptoContainer');
const tareasContainer = document.getElementById('tareasContainer');

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
 * Genera todo el contenido de la página
 */
function generarContenido() {
    generarMejorConcepto();
    generarTareas();
    aplicarTraduccionesEtiquetas();
}

/**
 * Genera la sección del mejor concepto
 */
function generarMejorConcepto() {
    if (!mejorConceptoContainer) return;
    
    // Determinar el mejor concepto basado en resultados
    const resultados = [4, 5, 6].map(n => parseFloat(data[`resultado${n}`]) || 0);
    let mejorIdx = resultados.indexOf(Math.max(...resultados));
    if (resultados.every(r => r === 0)) mejorIdx = -1;
    
    // Crear el texto del mejor concepto
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

    // Obtener opciones del mejor concepto
    const opciones = [];
    if (mejorIdx >= 0) {
        for (let g = 1; g <= 5; g++) {
            const key = `pastel_grupo${mejorIdx * 5 + g}`;
            const noSelectionText = (typeof t === 'function') 
                ? t('no_selection') || 'Sin selección' 
                : 'Sin selección';
            opciones.push(data[key] || noSelectionText);
        }
    }

    // Obtener textos traducidos
    const bestConceptText = (typeof t === 'function') 
        ? t('best_concept') || 'Mejor concepto' 
        : 'Mejor concepto';
    
    const compositionText = (typeof t === 'function') 
        ? t('concept_composition') || 'Composición del concepto' 
        : 'Composición del concepto';

    // Generar HTML
    mejorConceptoContainer.innerHTML = `
        <div class="mejor-concepto">
            ${bestConceptText} ${mejorConceptoTexto}
        </div>
        ${mejorIdx >= 0 ? `
            <div class="opciones-list">
                <strong>${compositionText}</strong>
                <ul>
                    <li>${opciones[0]}</li>
                    <li>${opciones[1]}</li>
                    <li>${opciones[2]}</li>
                    <li>${opciones[3]}</li>
                    <li>${opciones[4]}</li>
                </ul>
            </div>
        ` : ''}
    `;
}

/**
 * Genera las 15 filas de tareas con responsables
 */
function generarTareas() {
    if (!tareasContainer) return;
    
    tareasContainer.innerHTML = '';
    
    // Obtener textos traducidos para etiquetas y placeholders
    const responsableLabel = (typeof t === 'function') 
        ? t('responsable_label') || 'Responsable' 
        : 'Responsable';
    
    const taskLabel = (typeof t === 'function') 
        ? t('task_label') || 'Tarea' 
        : 'Tarea';
    
    const responsablePlaceholder = (typeof t === 'function') 
        ? t('enter_responsible') || 'Ingresa responsable' 
        : 'Ingresa responsable';
    
    const taskPlaceholder = (typeof t === 'function') 
        ? t('enter_task') || 'Describe la tarea' 
        : 'Describe la tarea';
    
    for (let i = 1; i <= 15; i++) {
        const responsable = data[`persona${i}`] || '';
        const tarea = data[`tarea${i}`] || '';

        const tareaDiv = document.createElement('div');
        tareaDiv.className = 'tarea-row';
        tareaDiv.innerHTML = `
            <div class="numero">${i}</div>
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
        `;
        tareasContainer.appendChild(tareaDiv);
    }
}

/**
 * Aplica traducciones a elementos específicos de la página
 */
function aplicarTraduccionesEtiquetas() {
    // Aplicar traducción al título de la tabla de tareas
    const tituloTabla = document.querySelector('.tabla-tareas h2');
    if (tituloTabla && tituloTabla.hasAttribute('data-i18n')) {
        const key = tituloTabla.getAttribute('data-i18n');
        if (typeof t === 'function') {
            tituloTabla.textContent = t(key) || tituloTabla.textContent;
        }
    }
    
    // Aplicar traducción al título principal de la página
    const tituloPrincipal = document.querySelector('.container h1');
    if (tituloPrincipal && tituloPrincipal.hasAttribute('data-i18n')) {
        const key = tituloPrincipal.getAttribute('data-i18n');
        if (typeof t === 'function') {
            tituloPrincipal.textContent = t(key) || tituloPrincipal.textContent;
        }
    }
}

/**
 * Guarda los datos y navega a la siguiente página
 */
function saveAndContinue() {
    const guardarBtn = document.getElementById('guardarBtn');
    if (!guardarBtn) return;
    
    // Guardar responsables y tareas
    document.querySelectorAll('input[data-key]').forEach(input => {
        if (input.dataset.key) {
            data[input.dataset.key] = input.value.trim();
        }
    });
    
    // Guardar en localStorage
    localStorage.setItem('projectData', JSON.stringify(data));
    
    // Navegar a la siguiente página
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
            // Regenerar contenido para aplicar nuevas traducciones
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
    const guardarBtn = document.getElementById('guardarBtn');
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
    generarContenido();
}

// ========== EJECUCIÓN AL CARGAR EL DOM ==========
document.addEventListener('DOMContentLoaded', initializePage);

// ========== EXPORTAR FUNCIONES PARA USO GLOBAL ==========
window.updateProjectName = updateProjectName;
window.generarContenido = generarContenido;
window.generarMejorConcepto = generarMejorConcepto;
window.generarTareas = generarTareas;
window.aplicarTraduccionesEtiquetas = aplicarTraduccionesEtiquetas;
window.saveAndContinue = saveAndContinue;