// ========== VARIABLES GLOBALES ==========
const data = JSON.parse(localStorage.getItem('projectData') || '{}');
const tablasContainer = document.getElementById('tablasContainer');

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
 * Genera las 5 tablas de formación de conceptos (una por concepto)
 */
function generarTablas() {
    if (!tablasContainer) return;
    
    tablasContainer.innerHTML = '';
    
    for (let conc = 1; conc <= 5; conc++) {
        const conceptoNombre = data[`concepto${conc}`] || `Concepto ${conc}`;
        
        const section = document.createElement('div');
        section.className = 'concepto-section';
        section.innerHTML = `
            <div class="concepto-title">${conceptoNombre}</div>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th data-i18n-col="1">Opción 1</th>
                        <th data-i18n-col="2">Opción 2</th>
                        <th data-i18n-col="3">Opción 3</th>
                        <th data-i18n="possibilities">Posibilidades</th>
                    </tr>
                </thead>
                <tbody>
                    ${[1, 2, 3].map(row => {
                        const posIdx = (conc - 1) * 3 + row;
                        const posibilidad = data[`pos${posIdx}`] || `Opción ${posIdx}`;
                        return `
                            <tr>
                                <td>${row}</td>
                                <td>
                                    <input type="checkbox" class="chk" data-conc="${conc}" 
                                           data-col="1" data-pos="${posIdx}">
                                </td>
                                <td>
                                    <input type="checkbox" class="chk" data-conc="${conc}" 
                                           data-col="2" data-pos="${posIdx}">
                                </td>
                                <td>
                                    <input type="checkbox" class="chk" data-conc="${conc}" 
                                           data-col="3" data-pos="${posIdx}">
                                </td>
                                <td class="posibilidad">${posibilidad}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        tablasContainer.appendChild(section);
    }
    
    // Aplicar traducciones a elementos dinámicos
    applyDynamicTranslations();
    
    // Configurar checkboxes y cargar selecciones guardadas
    configurarCheckboxes();
}

/**
 * Aplica traducciones a elementos generados dinámicamente
 */
function applyDynamicTranslations() {
    // Aplicar traducciones a los encabezados de tabla
    document.querySelectorAll('thead th[data-i18n]').forEach(th => {
        const key = th.getAttribute('data-i18n');
        if (typeof t === 'function') {
            th.textContent = t(key) || th.textContent;
        }
    });
    
    // Aplicar traducciones a las opciones (Opción 1, Opción 2, Opción 3)
    document.querySelectorAll('thead th[data-i18n-col]').forEach(th => {
        const colNum = th.getAttribute('data-i18n-col');
        let optionText = `Opción ${colNum}`;
        if (typeof t === 'function') {
            optionText = `${t('option') || 'Opción'} ${colNum}`;
        }
        th.textContent = optionText;
    });
    
    // Aplicar traducción al título de sección si existe
    const seccionTitulo = document.querySelector('.tabla-conceptos h2');
    if (seccionTitulo && seccionTitulo.hasAttribute('data-i18n')) {
        const key = seccionTitulo.getAttribute('data-i18n');
        if (typeof t === 'function') {
            seccionTitulo.textContent = t(key) || seccionTitulo.textContent;
        }
    }
}

/**
 * Configura los checkboxes con selección única por columna
 */
function configurarCheckboxes() {
    document.querySelectorAll('.chk').forEach(chk => {
        const conc = chk.dataset.conc;
        const col = chk.dataset.col;
        const pos = chk.dataset.pos;

        // Cargar selección guardada
        const groupKey = `pastel_grupo${(parseInt(conc) - 1) * 3 + parseInt(col)}`;
        if (data[groupKey] === data[`pos${pos}`]) {
            chk.checked = true;
        }

        chk.addEventListener('change', function() {
            handleCheckboxChange(this, conc, col, pos, groupKey);
        });
    });
}

/**
 * Maneja el cambio de estado de un checkbox
 */
function handleCheckboxChange(checkbox, conc, col, pos, groupKey) {
    if (checkbox.checked) {
        // Desmarcar otros checkboxes en la misma columna
        document.querySelectorAll(`.chk[data-conc="${conc}"][data-col="${col}"]`).forEach(other => {
            if (other !== checkbox) other.checked = false;
        });
        
        // Guardar selección
        data[groupKey] = data[`pos${pos}`] || '';
    } else {
        // Si se desmarca y no hay otro seleccionado, limpiar
        const anyChecked = Array.from(
            document.querySelectorAll(`.chk[data-conc="${conc}"][data-col="${col}"]`)
        ).some(c => c.checked);
        
        if (!anyChecked) {
            delete data[groupKey];
        }
    }
    
    // Guardar cambios inmediatamente (opcional)
    localStorage.setItem('projectData', JSON.stringify(data));
}

/**
 * Guarda los datos y navega a la siguiente página
 */
function saveAndContinue() {
    const guardarBtn = document.getElementById('guardarBtn');
    if (!guardarBtn) return;
    
    // Los datos ya se guardan automáticamente al cambiar checkboxes
    // Pero hacemos una última confirmación
    localStorage.setItem('projectData', JSON.stringify(data));
    
    // Navegar a la siguiente página
    window.location.href = 'evalConceptos.html';
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
            // Regenerar tablas para aplicar nuevas traducciones
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
    generarTablas();
}

// ========== EJECUCIÓN AL CARGAR EL DOM ==========
document.addEventListener('DOMContentLoaded', initializePage);

// ========== EXPORTAR FUNCIONES PARA USO GLOBAL ==========
window.updateProjectName = updateProjectName;
window.generarTablas = generarTablas;
window.configurarCheckboxes = configurarCheckboxes;
window.saveAndContinue = saveAndContinue;