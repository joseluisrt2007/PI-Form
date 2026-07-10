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
 * Devuelve todos los elementos que el usuario marcó en seleccionEvaluar
 * (ideas y/o tareas). Si no hay ninguno marcado, usa como fallback
 * todos los conceptos de ideas.html con contenido.
 */
function obtenerConceptosActivos() {
    const seleccionados = data.elementosAEvaluar || [];
    if (seleccionados.length > 0) {
        return seleccionados.map(e => ({ idx: e.idx, nombre: e.nombre, tipo: e.tipo }));
    }
    // Fallback: todos los conceptos de ideas.html
    const resultado = [];
    for (let conc = 1; conc <= 5; conc++) {
        const nombre = (data[`concepto${conc}`] || '').trim();
        if (nombre) resultado.push({ idx: conc, nombre, tipo: 'concepto' });
    }
    return resultado;
}

function contarConceptos() {
    return obtenerConceptosActivos().length;
}

function generarTablas() {
    if (!tablasContainer) return;
    tablasContainer.innerHTML = '';

    const conceptosActivos = obtenerConceptosActivos();

    if (conceptosActivos.length === 0) {
        const message = document.createElement('div');
        message.className = 'no-conceptos-message';
        message.textContent = 'No hay conceptos definidos. Regresa a la página anterior para ingresar conceptos.';
        tablasContainer.appendChild(message);
        return;
    }

    conceptosActivos.forEach(({ idx, nombre: conceptoNombre, tipo }) => {
        const section = document.createElement('div');
        section.className = 'concepto-section';
        section.innerHTML = `
            <div class="concepto-title">${conceptoNombre}</div>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th data-i18n="possibilities">Explorar posibilidades</th>
                    </tr>
                </thead>
                <tbody>
                    ${[1, 2, 3].map(i => {
                        // Clave única que incluye tipo e idx para evitar colisiones
                        // entre conceptos y tareas con el mismo índice numérico
                        const posKey = `pos_${tipo}_${idx}_${i}`;
                        const savedValue = data[posKey] || '';
                        const optionText = (typeof t === 'function')
                            ? `${t('options') || 'Opción'} ${i}`
                            : `Opción ${i}`;
                        const placeholderText = (typeof t === 'function')
                            ? `${t('enter_possibility') || 'Ingresa posibilidad'} ${i}`
                            : `Ingresa posibilidad ${i}`;
                        return `
                            <tr>
                                <td>${optionText}</td>
                                <td>
                                    <input type="text" class="posibilidad"
                                           data-pos-key="${posKey}"
                                           value="${savedValue}"
                                           placeholder="${placeholderText}">
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        tablasContainer.appendChild(section);
    });

    applyDynamicTranslations();
    if (guardarBtn) guardarBtn.disabled = false;
    if (continuarBtn) continuarBtn.disabled = false;
}

/**
 * Aplica traducciones a elementos generados dinámicamente
 */
function applyDynamicTranslations() {
    document.querySelectorAll('thead th[data-i18n]').forEach(th => {
        const key = th.getAttribute('data-i18n');
        if (typeof t === 'function') {
            th.textContent = t(key) || th.textContent;
        }
    });
    
    const seccionTitulo = document.querySelector('.tabla-morfologia h2');
    if (seccionTitulo && seccionTitulo.hasAttribute('data-i18n')) {
        const key = seccionTitulo.getAttribute('data-i18n');
        if (typeof t === 'function') {
            seccionTitulo.textContent = t(key) || seccionTitulo.textContent;
        }
    }
}

/**
 * SOLO GUARDA los datos en localStorage (sin navegar)
 */
function saveData() {
    document.querySelectorAll('.posibilidad').forEach(input => {
        const posKey = input.dataset.posKey;
        if (posKey) {
            data[posKey] = input.value.trim();
        }
    });
    localStorage.setItem('projectData', JSON.stringify(data));
    console.log('Datos guardados correctamente');
}

/**
 * GUARDA y NAVEGA a la siguiente página (calculada dinámicamente)
 */
function continueToNext() {
    saveData();  // Primero guarda los datos
    window.location.href = getNextPage('morfologia.html');  // Luego navega
}

/**
 * Navega a la página anterior (calculada dinámicamente)
 */
function goToPrevious() {
    window.location.href = getPreviousPage('morfologia.html');
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
    const anteriorBtn = document.getElementById('anteriorBtn');
    if (anteriorBtn) {
        anteriorBtn.addEventListener('click', goToPrevious);
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
window.saveData = saveData;
window.continueToNext = continueToNext;
window.contarConceptos = contarConceptos;