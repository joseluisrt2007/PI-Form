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
 * Genera las tablas de formación de conceptos (solo para conceptos con contenido)
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
    
    applyDynamicTranslations();
    configurarCheckboxes();
    
    // SIN RESTRICCIONES: Asegurar que los botones estén habilitados
    if (guardarBtn) {
        guardarBtn.disabled = false;
    }
    if (continuarBtn) {
        continuarBtn.disabled = false;
    }
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
    
    document.querySelectorAll('thead th[data-i18n-col]').forEach(th => {
        const colNum = th.getAttribute('data-i18n-col');
        let optionText = `Opción ${colNum}`;
        if (typeof t === 'function') {
            optionText = `${t('option') || 'Opción'} ${colNum}`;
        }
        th.textContent = optionText;
    });
    
    const seccionTitulo = document.querySelector('.tabla-conceptos h2');
    if (seccionTitulo && seccionTitulo.hasAttribute('data-i18n')) {
        const key = seccionTitulo.getAttribute('data-i18n');
        if (typeof t === 'function') {
            seccionTitulo.textContent = t(key) || seccionTitulo.textContent;
        }
    }
}

/**
 * Configura los checkboxes con selección única por columna - SIN RESTRICCIONES
 */
function configurarCheckboxes() {
    document.querySelectorAll('.chk').forEach(chk => {
        const conc = chk.dataset.conc;
        const col = chk.dataset.col;
        const pos = chk.dataset.pos;

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
 * Maneja el cambio de estado de un checkbox - SIN RESTRICCIONES
 */
function handleCheckboxChange(checkbox, conc, col, pos, groupKey) {
    if (checkbox.checked) {
        document.querySelectorAll(`.chk[data-conc="${conc}"][data-col="${col}"]`).forEach(other => {
            if (other !== checkbox) other.checked = false;
        });
        
        data[groupKey] = data[`pos${pos}`] || '';
    } else {
        const anyChecked = Array.from(
            document.querySelectorAll(`.chk[data-conc="${conc}"][data-col="${col}"]`)
        ).some(c => c.checked);
        
        if (!anyChecked) {
            delete data[groupKey];
        }
    }
    
    localStorage.setItem('projectData', JSON.stringify(data));
}

/**
 * SOLO GUARDA los datos en localStorage (sin navegar)
 */
function saveData() {
    localStorage.setItem('projectData', JSON.stringify(data));
    console.log('Datos guardados correctamente');
}

/**
 * GUARDA y NAVEGA a la siguiente página
 */
function continueToNext() {
    saveData();  // Primero guarda los datos
    window.location.href = 'evalConceptos.html';  // Luego navega
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
window.configurarCheckboxes = configurarCheckboxes;
window.saveData = saveData;
window.continueToNext = continueToNext;
window.contarConceptos = contarConceptos;