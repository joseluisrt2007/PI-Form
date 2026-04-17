// ========== VARIABLES GLOBALES ==========
const data = JSON.parse(localStorage.getItem('projectData') || '{}');
const tareasBody = document.getElementById('tareasBody');
const guardarBtn = document.getElementById('guardarBtn');
const continuarBtn = document.getElementById('continuarBtn');
const agregarTareaBtn = document.getElementById('agregarTareaBtn');

let contadorFilas = 0;

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

function generarContenido() {
    cargarFilasGuardadas();
    actualizarTraduccionesDinamicas();
    
    if (guardarBtn) guardarBtn.disabled = false;
    if (continuarBtn) continuarBtn.disabled = false;
}

function actualizarTraduccionesDinamicas() {
    const tituloTabla = document.querySelector('.tabla-tareas h2');
    if (tituloTabla) {
        if (typeof t === 'function') {
            tituloTabla.textContent = t('tasks_responsibles') || 'Enlace de entradas y salidas a través de funciones';
        }
    }
    
    const tituloPrincipal = document.querySelector('h1');
    if (tituloPrincipal) {
        if (typeof t === 'function') {
            tituloPrincipal.textContent = t('diagram') || 'Diagrama de funciones';
        }
    }
    
    const ths = document.querySelectorAll('#tareasTable thead th');
    if (ths.length >= 7 && typeof t === 'function') {
        ths[1].textContent = t('responsable_label') || 'Entrada';
        ths[3].textContent = t('task_label') || 'Función';
        ths[5].textContent = t('salida_label') || 'Salida';
    }
    
    if (agregarTareaBtn && typeof t === 'function') {
        agregarTareaBtn.innerHTML = `+ ${t('add_row') || 'Agregar fila'}`;
    }
    
    document.querySelectorAll('.persona-input').forEach(input => {
        input.placeholder = (typeof t === 'function') ? t('enter_responsible') || 'Ingresa la entrada' : 'Ingresa la entrada';
    });
    document.querySelectorAll('.tarea-input').forEach(input => {
        input.placeholder = (typeof t === 'function') ? t('enter_task') || 'Ingresa tarea' : 'Ingresa tarea';
        input.style.border = '3px solid var(--primary)';
        input.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
        input.style.fontWeight = '500';
    });
    document.querySelectorAll('.salida-input').forEach(input => {
        input.placeholder = (typeof t === 'function') ? t('enter_salida') || 'Describe la salida' : 'Describe la salida';
    });
}

function cargarFilasGuardadas() {
    if (!tareasBody) return;
    tareasBody.innerHTML = '';
    
    const numFilas = data.numeroTareas || 1;
    contadorFilas = numFilas;
    
    for (let i = 1; i <= numFilas; i++) {
        if (i > 1) {
            agregarFlechaVertical(i - 1);
        }
        agregarFilaPrincipal(i, false);
    }
}

function agregarFlechaVertical(filaIdOrigen) {
    const flechaRow = document.createElement('tr');
    flechaRow.className = 'flecha-vertical-row';
    flechaRow.setAttribute('data-flecha-id', filaIdOrigen);
    
    const estaOculta = data[`flecha_vertical_oculta_${filaIdOrigen}`] || false;
    
    if (estaOculta) {
        flechaRow.innerHTML = `
            <td colspan="7" class="flecha-vertical-oculta" data-flecha-id="${filaIdOrigen}">
                <div class="mensaje-oculto">👆 Click para mostrar flecha</div>
            </td>
        `;
        const celda = flechaRow.querySelector('td');
        celda.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleFlechaVertical(filaIdOrigen, celda);
        });
    } else {
        flechaRow.innerHTML = `
            <td colspan="7" class="flecha-vertical-clickable" data-flecha-id="${filaIdOrigen}">
                ↓
            </td>
        `;
        const celda = flechaRow.querySelector('td');
        celda.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleFlechaVertical(filaIdOrigen, celda);
        });
    }
    
    tareasBody.appendChild(flechaRow);
}

function toggleFlechaVertical(filaIdOrigen, celda) {
    const estaOculta = data[`flecha_vertical_oculta_${filaIdOrigen}`] || false;
    const nuevoEstado = !estaOculta;
    
    data[`flecha_vertical_oculta_${filaIdOrigen}`] = nuevoEstado;
    
    if (nuevoEstado) {
        celda.className = 'flecha-vertical-oculta';
        celda.setAttribute('colspan', '7');
        celda.innerHTML = '<div class="mensaje-oculto">👆 Click para mostrar flecha</div>';
    } else {
        celda.className = 'flecha-vertical-clickable';
        celda.setAttribute('colspan', '7');
        celda.innerHTML = '↓';
    }
    
    localStorage.setItem('projectData', JSON.stringify(data));
}

function crearCeldaOcultable(tipo, filaId, contenido, esInput = false, inputType = 'text', placeholder = '') {
    const celda = document.createElement('td');
    celda.className = 'celda-clickable';
    celda.setAttribute('data-tipo', tipo);
    celda.setAttribute('data-fila', filaId);
    
    const estaOculta = data[`celda_oculta_${tipo}_${filaId}`] || false;
    
    if (estaOculta) {
        celda.classList.add('celda-oculta');
        celda.innerHTML = `
            <div class="contenido-oculto">${contenido}</div>
            <div class="mensaje-oculto">👆 Click para mostrar</div>
        `;
    } else {
        if (esInput) {
            const input = document.createElement('input');
            input.type = inputType;
            input.value = contenido;
            input.placeholder = placeholder;
            input.maxLength = 30;
            input.setAttribute('data-key', `${tipo}${filaId}`);
            input.classList.add(`${tipo}-input`);
            input.style.width = '100%';
            input.style.padding = '0.75rem';
            input.style.border = '2px solid var(--border)';
            input.style.borderRadius = '10px';
            input.style.background = 'var(--surface)';
            input.style.color = 'var(--text-dark)';
            
            if (tipo === 'tarea') {
                input.style.border = '3px solid var(--primary)';
                input.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
                input.style.fontWeight = '500';
            }
            
            input.addEventListener('change', function() {
                const key = this.getAttribute('data-key');
                if (key) {
                    data[key] = this.value;
                    localStorage.setItem('projectData', JSON.stringify(data));
                }
            });
            
            celda.appendChild(input);
        } else {
            celda.innerHTML = contenido;
            if (tipo === 'flecha1' || tipo === 'flecha2') {
                celda.classList.add('flecha');
                celda.style.fontSize = '1.8rem';
                celda.style.fontWeight = 'bold';
                celda.style.textAlign = 'center';
            }
            if (tipo === 'numero') {
                celda.style.textAlign = 'center';
                celda.style.fontWeight = '600';
            }
        }
    }
    
    celda.addEventListener('click', function(e) {
        if (e.target.tagName === 'INPUT') {
            return;
        }
        toggleCelda(celda, tipo, filaId, contenido, esInput, inputType, placeholder);
    });
    
    return celda;
}

function toggleCelda(celda, tipo, filaId, contenido, esInput, inputType, placeholder) {
    const estaOculta = data[`celda_oculta_${tipo}_${filaId}`] || false;
    const nuevoEstado = !estaOculta;
    
    data[`celda_oculta_${tipo}_${filaId}`] = nuevoEstado;
    
    if (nuevoEstado) {
        celda.classList.add('celda-oculta');
        celda.innerHTML = `
            <div class="contenido-oculto">${contenido}</div>
            <div class="mensaje-oculto">👆 Click para mostrar</div>
        `;
    } else {
        celda.classList.remove('celda-oculta');
        if (esInput) {
            const input = document.createElement('input');
            input.type = inputType;
            input.value = contenido;
            input.placeholder = placeholder;
            input.maxLength = 30;
            input.setAttribute('data-key', `${tipo}${filaId}`);
            input.classList.add(`${tipo}-input`);
            input.style.width = '100%';
            input.style.padding = '0.75rem';
            input.style.border = '2px solid var(--border)';
            input.style.borderRadius = '10px';
            input.style.background = 'var(--surface)';
            input.style.color = 'var(--text-dark)';
            
            if (tipo === 'tarea') {
                input.style.border = '3px solid var(--primary)';
                input.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
                input.style.fontWeight = '500';
            }
            
            input.addEventListener('change', function() {
                const key = this.getAttribute('data-key');
                if (key) {
                    data[key] = this.value;
                    localStorage.setItem('projectData', JSON.stringify(data));
                    const nuevaCelda = this.parentElement;
                    const nuevoTipo = nuevaCelda.getAttribute('data-tipo');
                    const nuevaFila = nuevaCelda.getAttribute('data-fila');
                    data[`${nuevoTipo}${nuevaFila}`] = this.value;
                    localStorage.setItem('projectData', JSON.stringify(data));
                }
            });
            
            celda.innerHTML = '';
            celda.appendChild(input);
        } else {
            celda.innerHTML = contenido;
            if (tipo === 'flecha1' || tipo === 'flecha2') {
                celda.classList.add('flecha');
                celda.style.fontSize = '1.8rem';
                celda.style.fontWeight = 'bold';
                celda.style.textAlign = 'center';
            }
            if (tipo === 'numero') {
                celda.style.textAlign = 'center';
                celda.style.fontWeight = '600';
            }
        }
    }
    
    localStorage.setItem('projectData', JSON.stringify(data));
}

function agregarFilaPrincipal(filaId, esNueva = false) {
    const entrada = !esNueva ? (data[`persona${filaId}`] || '') : '';
    const funcion = !esNueva ? (data[`tarea${filaId}`] || '') : '';
    const salida = !esNueva ? (data[`salida${filaId}`] || '') : '';
    
    const placeholderEntrada = (typeof t === 'function') ? t('enter_responsible') || 'Ingresa la entrada' : 'Ingresa la entrada';
    const placeholderFuncion = (typeof t === 'function') ? t('enter_task') || 'Ingresa tarea' : 'Ingresa tarea';
    const placeholderSalida = (typeof t === 'function') ? t('enter_salida') || 'Describe la salida' : 'Describe la salida';
    
    const row = document.createElement('tr');
    row.setAttribute('data-fila-id', filaId);
    row.className = 'fila-principal';
    
    const celdaNumero = crearCeldaOcultable('numero', filaId, filaId.toString(), false);
    const celdaEntrada = crearCeldaOcultable('persona', filaId, entrada, true, 'text', placeholderEntrada);
    const celdaFlecha1 = crearCeldaOcultable('flecha1', filaId, '→', false);
    const celdaFuncion = crearCeldaOcultable('tarea', filaId, funcion, true, 'text', placeholderFuncion);
    const celdaFlecha2 = crearCeldaOcultable('flecha2', filaId, '→', false);
    const celdaSalida = crearCeldaOcultable('salida', filaId, salida, true, 'text', placeholderSalida);
    
    const celdaEliminar = document.createElement('td');
    celdaEliminar.setAttribute('data-tipo', 'eliminar');
    celdaEliminar.setAttribute('data-fila', filaId);
    const btnEliminar = document.createElement('button');
    btnEliminar.textContent = '🗑️';
    btnEliminar.className = 'btn-eliminar-fila';
    btnEliminar.setAttribute('data-id', filaId);
    btnEliminar.addEventListener('click', function(e) {
        e.stopPropagation();
        eliminarFila(filaId);
    });
    celdaEliminar.appendChild(btnEliminar);
    
    row.appendChild(celdaNumero);
    row.appendChild(celdaEntrada);
    row.appendChild(celdaFlecha1);
    row.appendChild(celdaFuncion);
    row.appendChild(celdaFlecha2);
    row.appendChild(celdaSalida);
    row.appendChild(celdaEliminar);
    
    tareasBody.appendChild(row);
}

function agregarNuevaFila() {
    contadorFilas++;
    
    if (contadorFilas > 1) {
        agregarFlechaVertical(contadorFilas - 1);
    }
    
    agregarFilaPrincipal(contadorFilas, true);
    
    data.numeroTareas = contadorFilas;
    localStorage.setItem('projectData', JSON.stringify(data));
    actualizarTraduccionesDinamicas();
}

function eliminarFila(filaId) {
    const row = document.querySelector(`tr.fila-principal[data-fila-id="${filaId}"]`);
    if (row) {
        row.remove();
        
        const flechaAntes = document.querySelector(`.flecha-vertical-row[data-flecha-id="${filaId - 1}"]`);
        if (flechaAntes) flechaAntes.remove();
        
        // Eliminar datos de la fila eliminada
        delete data[`persona${filaId}`];
        delete data[`tarea${filaId}`];
        delete data[`salida${filaId}`];
        
        const tipos = ['numero', 'persona', 'flecha1', 'tarea', 'flecha2', 'salida', 'eliminar'];
        tipos.forEach(tipo => {
            delete data[`celda_oculta_${tipo}_${filaId}`];
        });
        delete data[`flecha_vertical_oculta_${filaId - 1}`];
        
        // Renombrar datos de filas siguientes
        for (let i = filaId + 1; i <= 50; i++) {
            if (data[`persona${i}`] !== undefined) {
                data[`persona${i - 1}`] = data[`persona${i}`];
                delete data[`persona${i}`];
            }
            if (data[`tarea${i}`] !== undefined) {
                data[`tarea${i - 1}`] = data[`tarea${i}`];
                delete data[`tarea${i}`];
            }
            if (data[`salida${i}`] !== undefined) {
                data[`salida${i - 1}`] = data[`salida${i}`];
                delete data[`salida${i}`];
            }
            
            tipos.forEach(tipo => {
                if (data[`celda_oculta_${tipo}_${i}`] !== undefined) {
                    data[`celda_oculta_${tipo}_${i - 1}`] = data[`celda_oculta_${tipo}_${i}`];
                    delete data[`celda_oculta_${tipo}_${i}`];
                }
            });
            
            if (data[`flecha_vertical_oculta_${i}`] !== undefined) {
                data[`flecha_vertical_oculta_${i - 1}`] = data[`flecha_vertical_oculta_${i}`];
                delete data[`flecha_vertical_oculta_${i}`];
            }
        }
        
        reconstruirTabla();
        localStorage.setItem('projectData', JSON.stringify(data));
    }
}

function reconstruirTabla() {
    const filasRestantes = document.querySelectorAll('tr.fila-principal');
    const numFilas = filasRestantes.length;
    
    if (numFilas === 0) {
        contadorFilas = 1;
        data.numeroTareas = 1;
        
        // Limpiar TODOS los datos antiguos
        for (let i = 1; i <= 50; i++) {
            delete data[`persona${i}`];
            delete data[`tarea${i}`];
            delete data[`salida${i}`];
            const tipos = ['numero', 'persona', 'flecha1', 'tarea', 'flecha2', 'salida', 'eliminar'];
            tipos.forEach(tipo => {
                delete data[`celda_oculta_${tipo}_${i}`];
            });
            delete data[`flecha_vertical_oculta_${i}`];
        }
        
        localStorage.setItem('projectData', JSON.stringify(data));
        cargarFilasGuardadas();
        return;
    }
    
    // Guardar datos de filas existentes
    const filasData = [];
    filasRestantes.forEach(fila => {
        const oldId = parseInt(fila.getAttribute('data-fila-id'));
        const filaInfo = {
            oldId: oldId,
            persona: data[`persona${oldId}`] || '',
            tarea: data[`tarea${oldId}`] || '',
            salida: data[`salida${oldId}`] || '',
            celdasOcultas: {}
        };
        const tipos = ['numero', 'persona', 'flecha1', 'tarea', 'flecha2', 'salida', 'eliminar'];
        tipos.forEach(tipo => {
            if (data[`celda_oculta_${tipo}_${oldId}`]) {
                filaInfo.celdasOcultas[tipo] = true;
            }
        });
        filasData.push(filaInfo);
    });
    
    // Limpiar todo
    tareasBody.innerHTML = '';
    
    // Limpiar TODOS los datos antiguos
    for (let i = 1; i <= 50; i++) {
        delete data[`persona${i}`];
        delete data[`tarea${i}`];
        delete data[`salida${i}`];
        const tipos = ['numero', 'persona', 'flecha1', 'tarea', 'flecha2', 'salida', 'eliminar'];
        tipos.forEach(tipo => {
            delete data[`celda_oculta_${tipo}_${i}`];
        });
        delete data[`flecha_vertical_oculta_${i}`];
    }
    
    // Reconstruir
    contadorFilas = filasData.length;
    data.numeroTareas = contadorFilas;
    
    for (let i = 0; i < filasData.length; i++) {
        const nuevoId = i + 1;
        const filaInfo = filasData[i];
        
        if (filaInfo.persona) data[`persona${nuevoId}`] = filaInfo.persona;
        if (filaInfo.tarea) data[`tarea${nuevoId}`] = filaInfo.tarea;
        if (filaInfo.salida) data[`salida${nuevoId}`] = filaInfo.salida;
        
        Object.keys(filaInfo.celdasOcultas).forEach(tipo => {
            data[`celda_oculta_${tipo}_${nuevoId}`] = true;
        });
        
        if (nuevoId > 1) {
            agregarFlechaVertical(nuevoId - 1);
        }
        agregarFilaPrincipal(nuevoId, false);
    }
    
    localStorage.setItem('projectData', JSON.stringify(data));
    actualizarTraduccionesDinamicas();
}

function saveData() {
    localStorage.setItem('projectData', JSON.stringify(data));
    console.log('Datos guardados correctamente');
}

function continueToNext() {
    saveData();
    window.location.href = 'opcionConceptos.html';
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
            actualizarTraduccionesDinamicas();
            cargarFilasGuardadas();
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
    themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
}

function setupButtons() {
    if (guardarBtn) guardarBtn.addEventListener('click', saveData);
    if (continuarBtn) continuarBtn.addEventListener('click', continueToNext);
    if (agregarTareaBtn) agregarTareaBtn.addEventListener('click', agregarNuevaFila);
}

function initializePage() {
    setupLanguageSelector();
    setupThemeToggle();
    setupButtons();
    updateProjectName();
    generarContenido();
    
    if (guardarBtn) guardarBtn.disabled = false;
    if (continuarBtn) continuarBtn.disabled = false;
}

document.addEventListener('DOMContentLoaded', initializePage);

window.updateProjectName = updateProjectName;
window.generarContenido = generarContenido;
window.saveData = saveData;
window.continueToNext = continueToNext;
window.agregarNuevaFila = agregarNuevaFila;
window.eliminarFila = eliminarFila;
window.actualizarTraduccionesDinamicas = actualizarTraduccionesDinamicas;