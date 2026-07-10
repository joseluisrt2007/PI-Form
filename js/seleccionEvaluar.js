// =============================================
// SELECCIÓN DE ELEMENTOS A EVALUAR
// =============================================
// Genera dinámicamente una lista de checkboxes
// con los elementos disponibles según los módulos
// que el usuario activó en descripcion.html.
//
// Fuentes de elementos:
//   - Módulo 'definicionIdeas' → concepto1..5
//   - Módulo 'diagrama'        → tarea1..N (hasta data.numeroTareas)
//
// Resultado guardado en data.elementosAEvaluar:
//   Array de { tipo, idx, nombre }
//   Ej: [{ tipo:'concepto', idx:1, nombre:'Idea A' },
//        { tipo:'tarea',    idx:2, nombre:'Registro' }]
//
// Este array es la única fuente de verdad que leerán
// evaluacion.js y resultados.js para saber qué evaluar.

// ========== VARIABLES GLOBALES ==========
const data = JSON.parse(localStorage.getItem('projectData') || '{}');

// Muestra ideas (si definicionIdeas activo) Y tareas (si diagrama activo).
// Lo que el usuario marque aquí pasa al proceso de exploración:
// morfología, gc1 y evalConceptos.
// Las tareas NO pasan por evaluacion.html — solo las ideas hacen ese recorrido.
const FUENTES = [
    {
        tipo: 'concepto',
        moduloRequerido: 'definicionIdeas',
        labelKey: 'select_group_ideas',
        labelFallback: 'Ideas / Conceptos',
        obtenerElementos: () => {
            const elementos = [];
            for (let i = 1; i <= 5; i++) {
                const nombre = (data[`concepto${i}`] || '').trim();
                if (nombre) elementos.push({ tipo: 'concepto', idx: i, nombre });
            }
            return elementos;
        }
    },
    {
        tipo: 'tarea',
        moduloRequerido: 'diagrama',
        labelKey: 'select_group_tasks',
        labelFallback: 'Funciones del Diagrama de Actividades',
        obtenerElementos: () => {
            const elementos = [];
            const numTareas = parseInt(data.numeroTareas) || 0;
            for (let i = 1; i <= numTareas; i++) {
                const nombre = (data[`tarea${i}`] || '').trim();
                if (nombre) elementos.push({ tipo: 'tarea', idx: i, nombre });
            }
            return elementos;
        }
    }
];

// ========== ESTADO DE LA PÁGINA ==========
// Registro en memoria de las tarjetas renderizadas:
// { tipo, idx, nombre (editable), checked, cardEl, inputEl }
let tarjetasRenderizadas = [];

// ========== FUNCIONES DE UTILIDAD ==========

function updateProjectName() {
    const projectText = document.getElementById('projectNameText');
    if (!projectText) return;
    if (data.projectName && data.projectName.trim()) {
        projectText.textContent = data.projectName;
    } else {
        projectText.textContent = (typeof t === 'function' ? t('unnamed_project') : null) || '(Sin nombre)';
    }
}

function updateThemeButton() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    if (currentTheme === 'dark') {
        themeToggle.textContent = '☀️';
        themeToggle.title = (typeof t === 'function' ? t('theme_light') : null) || 'Cambiar a modo claro';
    } else {
        themeToggle.textContent = '🌙';
        themeToggle.title = (typeof t === 'function' ? t('theme_dark') : null) || 'Cambiar a modo oscuro';
    }
}

function setupLanguageSelector() {
    const langSelector = document.getElementById('languageSelector');
    if (!langSelector) return;
    langSelector.value = localStorage.getItem('preferredLanguage') || 'es';
    langSelector.addEventListener('change', function () {
        if (typeof setLanguage === 'function') {
            setLanguage(this.value);
            updateProjectName();
            updateThemeButton();
            // Re-renderizar para actualizar textos de grupos
            renderizarElementos();
        }
    });
}

function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeButton();
    if (themeToggle) {
        themeToggle.addEventListener('click', function () {
            const current = document.documentElement.getAttribute('data-theme');
            const newTheme = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeButton();
        });
    }
}

// ========== CREACIÓN DE TARJETAS ==========

/**
 * Crea el elemento DOM de una tarjeta de elemento evaluable.
 * Cada tarjeta tiene:
 *   - Checkbox de selección (el click en la card entera lo activa)
 *   - Texto del nombre (en modo lectura)
 *   - Input de nombre (en modo edición, oculto por defecto)
 *   - Botón lápiz para alternar entre lectura y edición
 */
function crearTarjeta(entry) {
    // entry = { tipo, idx, nombre, checked }

    const card = document.createElement('div');
    card.className = 'elemento-card' + (entry.checked ? ' seleccionado' : '');
    card.dataset.tipo = entry.tipo;
    card.dataset.idx = entry.idx;

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = entry.checked;
    checkbox.addEventListener('change', () => {
        entry.checked = checkbox.checked;
        card.classList.toggle('seleccionado', checkbox.checked);
    });

    // Clic en la tarjeta (pero NO en el checkbox, el lápiz ni el input) activa el checkbox
    card.addEventListener('click', (e) => {
        if (e.target === checkbox || e.target === btnEditar || e.target === inputNombre) return;
        checkbox.checked = !checkbox.checked;
        entry.checked = checkbox.checked;
        card.classList.toggle('seleccionado', checkbox.checked);
    });

    // Texto del nombre (modo lectura)
    const textoNombre = document.createElement('span');
    textoNombre.className = 'elemento-nombre-texto';
    textoNombre.textContent = entry.nombre;

    // Input del nombre (modo edición, oculto inicialmente)
    const inputNombre = document.createElement('input');
    inputNombre.type = 'text';
    inputNombre.className = 'elemento-nombre-input';
    inputNombre.value = entry.nombre;
    inputNombre.style.display = 'none';
    inputNombre.addEventListener('input', () => {
        entry.nombre = inputNombre.value;
        textoNombre.textContent = inputNombre.value;
    });
    inputNombre.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') terminarEdicion();
    });

    // Botón lápiz
    const btnEditar = document.createElement('button');
    btnEditar.type = 'button';
    btnEditar.className = 'btn-editar';
    btnEditar.title = 'Editar nombre';
    btnEditar.innerHTML = '✏️';
    btnEditar.setAttribute('aria-label', 'Editar nombre del elemento');

    let editando = false;

    function iniciarEdicion() {
        editando = true;
        textoNombre.style.display = 'none';
        inputNombre.style.display = '';
        inputNombre.focus();
        inputNombre.select();
        btnEditar.classList.add('editando');
    }

    function terminarEdicion() {
        editando = false;
        const nuevoNombre = inputNombre.value.trim();
        if (nuevoNombre) {
            entry.nombre = nuevoNombre;
            textoNombre.textContent = nuevoNombre;
        } else {
            // Si queda vacío, restaura el nombre original
            inputNombre.value = entry.nombre;
        }
        textoNombre.style.display = '';
        inputNombre.style.display = 'none';
        btnEditar.classList.remove('editando');
    }

    btnEditar.addEventListener('click', (e) => {
        e.stopPropagation();
        if (editando) {
            terminarEdicion();
        } else {
            iniciarEdicion();
        }
    });

    inputNombre.addEventListener('blur', terminarEdicion);

    card.appendChild(checkbox);
    card.appendChild(textoNombre);
    card.appendChild(inputNombre);
    card.appendChild(btnEditar);

    // Guardar referencia para saveData()
    entry.cardEl = card;
    entry.inputEl = inputNombre;

    return card;
}

// ========== RENDER PRINCIPAL ==========

/**
 * Lee los módulos activos, obtiene los elementos disponibles
 * de cada fuente y construye la interfaz de tarjetas.
 * También restaura las selecciones guardadas previamente.
 */
function renderizarElementos() {
    const container = document.getElementById('elementosContainer');
    const sinElementosMsg = document.getElementById('sinElementosMsg');
    if (!container) return;

    container.innerHTML = '';
    tarjetasRenderizadas = [];

    const modulos = data.modulosSeleccionados || {};
    const guardados = data.elementosAEvaluar || [];   // selecciones previas

    // Índice de selecciones previas para restaurar estado
    // clave: "tipo_idx"
    const seleccionPrev = {};
    guardados.forEach(e => {
        seleccionPrev[`${e.tipo}_${e.idx}`] = e.nombre; // guardado = seleccionado
    });

    let hayAlgunElemento = false;

    FUENTES.forEach(fuente => {
        if (!modulos[fuente.moduloRequerido]) return; // módulo no activo

        const elementos = fuente.obtenerElementos();
        if (elementos.length === 0) return;

        hayAlgunElemento = true;

        // Encabezado de grupo
        const grupoEl = document.createElement('div');
        grupoEl.className = 'grupo-modulo';

        const titulo = document.createElement('div');
        titulo.className = 'grupo-modulo-titulo';
        titulo.textContent = (typeof t === 'function' ? t(fuente.labelKey) : null)
            || fuente.labelFallback;
        grupoEl.appendChild(titulo);

        elementos.forEach(elem => {
            const clave = `${elem.tipo}_${elem.idx}`;
            const estaSeleccionado = clave in seleccionPrev;
            // Si estaba guardado, restaurar el nombre editado (pudo haber cambiado)
            const nombreRestaurado = estaSeleccionado
                ? (seleccionPrev[clave] || elem.nombre)
                : elem.nombre;

            const entry = {
                tipo: elem.tipo,
                idx: elem.idx,
                nombre: nombreRestaurado,
                checked: estaSeleccionado,
                cardEl: null,
                inputEl: null
            };

            const card = crearTarjeta(entry);
            grupoEl.appendChild(card);
            tarjetasRenderizadas.push(entry);
        });

        container.appendChild(grupoEl);
    });

    // Mostrar u ocultar mensaje de "sin elementos"
    if (!hayAlgunElemento) {
        sinElementosMsg.style.display = '';
    } else {
        sinElementosMsg.style.display = 'none';
    }
}

// ========== PERSISTENCIA ==========

/**
 * Lee el estado actual de las tarjetas y guarda en
 * data.elementosAEvaluar solo las que están marcadas.
 * Respeta el nombre editado por el usuario.
 */
function saveData() {
    data.elementosAEvaluar = tarjetasRenderizadas
        .filter(e => e.checked)
        .map(e => ({ tipo: e.tipo, idx: e.idx, nombre: e.nombre }));

    localStorage.setItem('projectData', JSON.stringify(data));
    console.log('elementosAEvaluar guardados:', data.elementosAEvaluar);
}

function continueToNext() {
    saveData();
    window.location.href = getNextPage('seleccionEvaluar.html');
}

function goToPrevious() {
    window.location.href = getPreviousPage('seleccionEvaluar.html');
}

// ========== SETUP DE BOTONES ==========

function setupButtons() {
    const guardarBtn = document.getElementById('guardarBtn');
    const continuarBtn = document.getElementById('continuarBtn');
    const anteriorBtn = document.getElementById('anteriorBtn');

    if (guardarBtn) guardarBtn.addEventListener('click', saveData);
    if (continuarBtn) continuarBtn.addEventListener('click', continueToNext);
    if (anteriorBtn) anteriorBtn.addEventListener('click', goToPrevious);
}

// ========== INICIALIZACIÓN ==========

function initializePage() {
    setupLanguageSelector();
    setupThemeToggle();
    renderizarElementos();
    setupButtons();
    updateProjectName();
}

document.addEventListener('DOMContentLoaded', initializePage);

// ========== EXPORTAR PARA USO GLOBAL ==========
window.saveData = saveData;
window.continueToNext = continueToNext;
