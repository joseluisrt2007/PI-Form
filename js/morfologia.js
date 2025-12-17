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
 * Genera las 5 tablas de morfología (una por concepto)
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
                        <th data-i18n="possibilities">Explorar posibilidades</th>
                    </tr>
                </thead>
                <tbody>
                    ${[1, 2, 3].map(i => {
                        const posIdx = (conc - 1) * 3 + i;
                        const savedValue = data[`pos${posIdx}`] || '';
                        
                        // Obtener textos traducidos
                        const optionText = (typeof t === 'function') 
                            ? `${t('option') || 'Opción'} ${i}` 
                            : `Opción ${i}`;
                        
                        const placeholderText = (typeof t === 'function') 
                            ? `${t('enter_possibility') || 'Ingresa posibilidad'} ${i}` 
                            : `Ingresa posibilidad ${i}`;
                        
                        return `
                            <tr>
                                <td>${optionText}</td>
                                <td>
                                    <input type="text" class="posibilidad" data-idx="${posIdx}" 
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
    }
    
    // Aplicar traducciones a elementos dinámicos
    applyDynamicTranslations();
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
    
    // Aplicar traducción al título de sección si existe
    const seccionTitulo = document.querySelector('.tabla-morfologia h2');
    if (seccionTitulo && seccionTitulo.hasAttribute('data-i18n')) {
        const key = seccionTitulo.getAttribute('data-i18n');
        if (typeof t === 'function') {
            seccionTitulo.textContent = t(key) || seccionTitulo.textContent;
        }
    }
}

/**
 * Guarda los datos y navega a la siguiente página
 */
function saveAndContinue() {
    const guardarBtn = document.getElementById('guardarBtn');
    if (!guardarBtn) return;
    
    // Guardar todas las posibilidades
    document.querySelectorAll('.posibilidad').forEach(input => {
        const idx = input.dataset.idx;
        if (idx) {
            data[`pos${idx}`] = input.value.trim();
        }
    });
    
    // Guardar en localStorage
    localStorage.setItem('projectData', JSON.stringify(data));
    
    // Navegar a la siguiente página
    window.location.href = 'gc1.html';
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
window.saveAndContinue = saveAndContinue;