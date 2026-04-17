// ========== VARIABLES GLOBALES ==========
const data = JSON.parse(localStorage.getItem('projectData') || '{}');
const mejorConceptoContainer = document.getElementById('mejorConceptoContainer');
const tablasContainer = document.getElementById('tablasContainer');
const guardarBtn = document.getElementById('guardarBtn');
const continuarBtn = document.getElementById('continuarBtn');
const agregarTablaBtn = document.getElementById('agregarTablaBtn');

let contadorTablas = 1;

// ========== FUNCIONES PRINCIPALES ==========

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

function generarContenido() {
    generarMejorConcepto();
    cargarTablasGuardadas();
    
    if (guardarBtn) guardarBtn.disabled = false;
    if (continuarBtn) continuarBtn.disabled = false;
}

function cargarTablasGuardadas() {
    if (!tablasContainer) return;
    tablasContainer.innerHTML = '';
    
    const numTablas = data.numeroPrevenciones || 1;
    contadorTablas = numTablas;
    
    for (let i = 1; i <= numTablas; i++) {
        generarTablaPrevencion(i, false);
    }
}

function generarTablaPrevencion(tablaId, esNueva = false) {
    const section = document.createElement('div');
    section.className = 'tabla-prevencion';
    section.setAttribute('data-tabla-id', tablaId);
    
    const preventionText = (typeof t === 'function') ? t('prevention') || 'Prevención' : 'Prevención';
    
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
    
    const fallaPotencial = !esNueva ? (data[`fallaPotencial${tablaId}`] || '') : '';
    const efecto = !esNueva ? (data[`efecto${tablaId}`] || '') : '';
    const sev = !esNueva ? (data[`sev${tablaId}`] || '') : '';
    const ocu = !esNueva ? (data[`ocu${tablaId}`] || '') : '';
    const riesgo = !esNueva ? (data[`riesgo${tablaId}`] || '0.00') : '0.00';
    const accionReal = !esNueva ? (data[`accionReal${tablaId}`] || '') : '';
    const responsable = !esNueva ? (data[`responsable${tablaId}`] || '') : '';
    const fechaCell = !esNueva ? (data[`fechaCell${tablaId}`] || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0];
    const accionTom = !esNueva ? (data[`accionTom${tablaId}`] || '') : '';
    const fecha = !esNueva ? (data[`fecha${tablaId}`] || '') : '';
    
    section.innerHTML = `
        <div class="tabla-title">${preventionText} ${tablaId}</div>
        <table>
            <tr>
                <th>${getTranslatedText('potential_failure')}</th>
                <td><input type="text" data-key="fallaPotencial${tablaId}" value="${fallaPotencial.replace(/"/g, '&quot;')}" placeholder="${getPlaceholder('enter_task')}"></td>
            </tr>
            <tr>
                <th>${getTranslatedText('effect')}</th>
                <td><input type="text" data-key="efecto${tablaId}" value="${efecto.replace(/"/g, '&quot;')}" placeholder="${getPlaceholder('enter_task')}"></td>
            </tr>
            <tr>
                <th>${getTranslatedText('severity')}</th>
                <td><input type="number" class="sev" data-tabla="${tablaId}" min="1" max="10" step="1" value="${sev}" placeholder="${getPlaceholder('enter_severity')}"></td>
            </tr>
            <tr>
                <th>${getTranslatedText('occurrence')}</th>
                <td><input type="number" class="ocu" data-tabla="${tablaId}" min="1" max="10" step="1" value="${ocu}" placeholder="${getPlaceholder('enter_occurrence')}"></td>
            </tr>
        </table>
        
        <!-- BOTÓN DE CALCULAR AQUÍ (más arriba, antes de acciones) -->
        <div style="text-align: center; margin: 1.5rem 0;">
            <button class="btn-calc" onclick="calcularRiesgo(${tablaId})">
                ${getTranslatedText('risk_calculation')}
            </button>
        </div>
        
        <div style="margin-top: 1rem;">
            <div class="riesgo-cell" style="margin-bottom: 1.5rem;">
                <span style="font-weight: 600;">${getTranslatedText('risk') || 'Riesgo'}:</span>
                <span class="riesgo" id="riesgo${tablaId}" style="font-size: 1.5rem; font-weight: 700; margin-left: 0.5rem;">${riesgo}</span>
            </div>
        </div>
        
        <table>
            <tr>
                <th>${getTranslatedText('actions_to_take')}</th>
                <td><input type="text" data-key="accionReal${tablaId}" value="${accionReal.replace(/"/g, '&quot;')}" placeholder="${getPlaceholder('enter_task')}"></td>
            </tr>
            <tr>
                <th>${getTranslatedText('responsible')}</th>
                <td><input type="text" data-key="responsable${tablaId}" value="${responsable.replace(/"/g, '&quot;')}" placeholder="${getPlaceholder('enter_responsible')}"></td>
            </tr>
            <tr>
                <th>${getTranslatedText('today_date')}</th>
                <td><input type="date" data-key="fechaCell${tablaId}" value="${fechaCell}"></td>
            </tr>
            <tr>
                <th>${getTranslatedText('action_taken')}</th>
                <td><input type="text" data-key="accionTom${tablaId}" value="${accionTom.replace(/"/g, '&quot;')}" placeholder="${getPlaceholder('enter_task')}"></td>
            </tr>
            <tr>
                <th>${getTranslatedText('action_date')}</th>
                <td><input type="date" data-key="fecha${tablaId}" value="${fecha}"></td>
            </tr>
        </table>
        
        <div class="tabla-buttons" style="text-align: center; margin-top: 1rem;">
            ${tablaId > 1 ? `<button class="btn-eliminar-tabla" onclick="eliminarTabla(${tablaId})">🗑️ Eliminar</button>` : ''}
        </div>
    `;
    tablasContainer.appendChild(section);
}

function agregarTabla() {
    contadorTablas++;
    generarTablaPrevencion(contadorTablas, true);
    data.numeroPrevenciones = contadorTablas;
    localStorage.setItem('projectData', JSON.stringify(data));
    configurarEventosInputs();
}

function eliminarTabla(tablaId) {
    if (confirm('¿Eliminar esta prevención?')) {
        const tablaElement = document.querySelector(`.tabla-prevencion[data-tabla-id="${tablaId}"]`);
        if (tablaElement) {
            tablaElement.remove();
            
            delete data[`fallaPotencial${tablaId}`];
            delete data[`efecto${tablaId}`];
            delete data[`sev${tablaId}`];
            delete data[`ocu${tablaId}`];
            delete data[`riesgo${tablaId}`];
            delete data[`accionReal${tablaId}`];
            delete data[`responsable${tablaId}`];
            delete data[`fechaCell${tablaId}`];
            delete data[`accionTom${tablaId}`];
            delete data[`fecha${tablaId}`];
            
            const tablasRestantes = document.querySelectorAll('.tabla-prevencion').length;
            contadorTablas = tablasRestantes;
            data.numeroPrevenciones = contadorTablas;
            
            renumerarTablas();
            localStorage.setItem('projectData', JSON.stringify(data));
        }
    }
}

function renumerarTablas() {
    const tablas = document.querySelectorAll('.tabla-prevencion');
    let nuevoId = 1;
    
    tablas.forEach(tabla => {
        const oldId = parseInt(tabla.getAttribute('data-tabla-id'));
        tabla.setAttribute('data-tabla-id', nuevoId);
        
        const title = tabla.querySelector('.tabla-title');
        const preventionText = (typeof t === 'function') ? t('prevention') || 'Prevención' : 'Prevención';
        if (title) title.textContent = `${preventionText} ${nuevoId}`;
        
        tabla.querySelectorAll('input[data-key]').forEach(input => {
            const oldKey = input.getAttribute('data-key');
            const newKey = oldKey.replace(/\d+$/, nuevoId);
            input.setAttribute('data-key', newKey);
            if (data[oldKey] !== undefined) {
                data[newKey] = data[oldKey];
                delete data[oldKey];
            }
        });
        
        tabla.querySelectorAll('.sev').forEach(input => {
            input.setAttribute('data-tabla', nuevoId);
        });
        tabla.querySelectorAll('.ocu').forEach(input => {
            input.setAttribute('data-tabla', nuevoId);
        });
        
        const riesgoSpan = tabla.querySelector(`#riesgo${oldId}`);
        if (riesgoSpan) {
            riesgoSpan.id = `riesgo${nuevoId}`;
            if (data[`riesgo${oldId}`] !== undefined) {
                data[`riesgo${nuevoId}`] = data[`riesgo${oldId}`];
                delete data[`riesgo${oldId}`];
            }
        }
        
        const btnCalc = tabla.querySelector('.btn-calc');
        if (btnCalc) {
            btnCalc.setAttribute('onclick', `calcularRiesgo(${nuevoId})`);
        }
        
        const btnEliminar = tabla.querySelector('.btn-eliminar-tabla');
        if (btnEliminar) {
            btnEliminar.setAttribute('onclick', `eliminarTabla(${nuevoId})`);
        }
        
        nuevoId++;
    });
    
    contadorTablas = nuevoId - 1;
}

function configurarEventosInputs() {
    document.querySelectorAll('.sev, .ocu').forEach(input => {
        input.removeEventListener('input', handleRiskInput);
        input.addEventListener('input', handleRiskInput);
    });
}

function handleRiskInput() {
    const tabla = this.dataset.tabla;
    if (tabla) {
        calcularRiesgo(parseInt(tabla));
    }
}

function generarMejorConcepto() {
    if (!mejorConceptoContainer) return;
    
    const resultados = [4, 5, 6].map(n => parseFloat(data[`resultado${n}`]) || 0);
    let mejorIdx = resultados.indexOf(Math.max(...resultados));
    if (resultados.every(r => r === 0)) mejorIdx = -1;
    
    const conceptosExistentes = obtenerConceptosExistentes();
    
    let mejorConceptoTexto;
    if (mejorIdx >= 0) {
        const conceptFormedText = (typeof t === 'function') ? t('concept_formed') || 'Concepto formado' : 'Concepto formado';
        mejorConceptoTexto = `${conceptFormedText} ${mejorIdx + 1}`;
    } else {
        mejorConceptoTexto = (typeof t === 'function') ? t('no_concept_selected') || 'No se ha seleccionado concepto' : 'No se ha seleccionado concepto';
    }

    const opciones = [];
    if (mejorIdx >= 0 && conceptosExistentes.length > 0) {
        for (const conc of conceptosExistentes) {
            const key = `pastel_grupo${(conc - 1) * 3 + (mejorIdx + 1)}`;
            const noSelectionText = (typeof t === 'function') ? t('no_selection') || 'Sin selección' : 'Sin selección';
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
    
    data.numeroPrevenciones = contadorTablas;
    localStorage.setItem('projectData', JSON.stringify(data));
    console.log('Datos guardados correctamente');
}

function continueToNext() {
    saveData();
    window.location.href = 'resultados.html';
}

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

function updateThemeButton() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    
    if (currentTheme === 'dark') {
        themeToggle.textContent = '☀️';
        themeToggle.title = 'Cambiar a modo claro';
        if (typeof t === 'function') themeToggle.title = t('theme_light') || 'Cambiar a modo claro';
    } else {
        themeToggle.textContent = '🌙';
        themeToggle.title = 'Cambiar a modo oscuro';
        if (typeof t === 'function') themeToggle.title = t('theme_dark') || 'Cambiar a modo oscuro';
    }
}

function setupButtons() {
    if (guardarBtn) guardarBtn.addEventListener('click', saveData);
    if (continuarBtn) continuarBtn.addEventListener('click', continueToNext);
    if (agregarTablaBtn) agregarTablaBtn.addEventListener('click', agregarTabla);
}

function initializePage() {
    setupLanguageSelector();
    setupThemeToggle();
    setupButtons();
    updateProjectName();
    generarContenido();
    
    if (guardarBtn) guardarBtn.disabled = false;
    if (continuarBtn) continuarBtn.disabled = false;
    
    setTimeout(() => {
        configurarEventosInputs();
    }, 100);
}

document.addEventListener('DOMContentLoaded', initializePage);

window.updateProjectName = updateProjectName;
window.generarContenido = generarContenido;
window.generarMejorConcepto = generarMejorConcepto;
window.calcularRiesgo = calcularRiesgo;
window.saveData = saveData;
window.continueToNext = continueToNext;
window.obtenerConceptosExistentes = obtenerConceptosExistentes;
window.agregarTabla = agregarTabla;
window.eliminarTabla = eliminarTabla;