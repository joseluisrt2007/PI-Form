// ========== VARIABLES GLOBALES ==========
const data = JSON.parse(localStorage.getItem('projectData') || '{}');
const tablasContainer = document.getElementById('tablasContainer');
const guardarBtn = document.getElementById('guardarBtn');
const continuarBtn = document.getElementById('continuarBtn');

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
            applyDynamicTranslations();
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

// ========== LÓGICA DE ELEMENTOS A EVALUAR ==========

/**
 * Devuelve todas las ideas definidas en ideas.html.
 * La evaluación inicial incluye automáticamente todas
 * las ideas con contenido, sin filtro de checkboxes.
 */
function obtenerElementos() {
    const elementos = [];
    for (let i = 1; i <= 5; i++) {
        const nombre = (data[`concepto${i}`] || '').trim();
        if (nombre) {
            elementos.push({ tipo: 'concepto', idx: i, nombre });
        }
    }
    return elementos;
}

/**
 * Clave única para calificaciones.
 * Ej: "eval_concepto_2_crit3"  /  "eval_tarea_1_crit5"
 */
function claveCalif(tipo, idx, crit) {
    return `eval_${tipo}_${idx}_crit${crit}`;
}

/**
 * Clave única para el resultado calculado.
 * Ej: "eval_resultado_concepto_2"  /  "eval_resultado_tarea_1"
 */
function claveResultado(tipo, idx) {
    return `eval_resultado_${tipo}_${idx}`;
}

// ========== GENERACIÓN DE TABLAS ==========

function generarTablas() {
    if (!tablasContainer) return;
    tablasContainer.innerHTML = '';

    const elementos = obtenerElementos();

    if (elementos.length === 0) {
        const message = document.createElement('div');
        message.className = 'no-conceptos-message';
        message.textContent = 'No hay elementos seleccionados para evaluar. ' +
            'Regresa a la página anterior y selecciona al menos uno.';
        tablasContainer.appendChild(message);
        return;
    }

    elementos.forEach(elem => {
        const { tipo, idx, nombre } = elem;
        const resId = `res_${tipo}_${idx}`;

        const section = document.createElement('div');
        section.className = 'concepto-section';
        section.innerHTML = `
            <div class="concepto-title">${nombre}</div>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th data-i18n="criteria">Criterio</th>
                        <th data-i18n="rating">Calificación (0-10)</th>
                        <th data-i18n="result">Resultado</th>
                    </tr>
                </thead>
                <tbody>
                    ${[1, 2, 3, 4, 5].map(i => `
                        <tr>
                            <td>${i}</td>
                            <td>${data[`criterio${i}`] || `Criterio ${i}`}</td>
                            <td>
                                <input type="number"
                                       class="calif"
                                       data-tipo="${tipo}"
                                       data-idx="${idx}"
                                       data-crit="${i}"
                                       min="0" max="10" step="0.1"
                                       value="${data[claveCalif(tipo, idx, i)] || ''}">
                            </td>
                            <td>${i === 1 ? `<span class="resultado" id="${resId}">-</span>` : ''}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <button class="btn-calc"
                    data-tipo="${tipo}"
                    data-idx="${idx}"
                    data-i18n="calculate">Calcular</button>
        `;
        tablasContainer.appendChild(section);
    });

    applyDynamicTranslations();
    recalcularTodo();

    if (guardarBtn) guardarBtn.disabled = false;
    if (continuarBtn) continuarBtn.disabled = false;

    document.querySelectorAll('.calif').forEach(input => {
        input.addEventListener('input', function () {
            const { tipo, idx } = this.dataset;
            const resEl = document.getElementById(`res_${tipo}_${idx}`);
            if (resEl) resEl.textContent = '-';
            delete data[claveResultado(tipo, idx)];
        });
    });

    tablasContainer.querySelectorAll('.btn-calc').forEach(btn => {
        btn.addEventListener('click', function () {
            calcular(this.dataset.tipo, this.dataset.idx);
        });
    });
}

function applyDynamicTranslations() {
    document.querySelectorAll('.btn-calc').forEach(btn => {
        if (typeof t === 'function') btn.textContent = t('calculate') || 'Calcular';
    });
    document.querySelectorAll('thead th[data-i18n]').forEach(th => {
        const key = th.getAttribute('data-i18n');
        if (typeof t === 'function') th.textContent = t(key) || th.textContent;
    });
}

function calcular(tipo, idx) {
    let total = 0;
    for (let i = 1; i <= 5; i++) {
        const input = document.querySelector(
            `input[data-tipo="${tipo}"][data-idx="${idx}"][data-crit="${i}"]`
        );
        if (!input) continue;
        if (input.value === '') input.value = '0';
        const calif = parseFloat(input.value) || 0;
        const peso  = parseFloat(data[`peso${i}`]) || 0;
        total += calif * peso;
        data[claveCalif(tipo, idx, i)] = input.value;
    }
    const resultado = total.toFixed(2);
    const resEl = document.getElementById(`res_${tipo}_${idx}`);
    if (resEl) resEl.textContent = resultado;
    data[claveResultado(tipo, idx)] = resultado;
}

function recalcularTodo() {
    obtenerElementos().forEach(({ tipo, idx }) => {
        const resGuardado = data[claveResultado(tipo, idx)];
        const resEl = document.getElementById(`res_${tipo}_${idx}`);
        if (resEl) resEl.textContent = resGuardado || '-';
    });
}

// ========== PERSISTENCIA ==========

function saveData() {
    document.querySelectorAll('.calif').forEach(input => {
        const { tipo, idx, crit } = input.dataset;
        if (tipo && idx && crit) {
            data[claveCalif(tipo, idx, crit)] = input.value === '' ? '0' : input.value;
        }
    });
    localStorage.setItem('projectData', JSON.stringify(data));
}

function continueToNext() {
    saveData();
    window.location.href = getNextPage('evaluacion.html');
}

function goToPrevious() {
    window.location.href = getPreviousPage('evaluacion.html');
}

// ========== EXPORTAR / IMPORTAR EVALUACIÓN (.txt) ==========

function getEvaluacionFilename() {
    const base = (data.projectName || 'evaluacion').trim();
    const safeBase = base.replace(/[^a-z0-9_\-]+/gi, '_').replace(/^_+|_+$/g, '') || 'evaluacion';
    return `${safeBase}_evaluacion_ideas.txt`;
}

/**
 * Construye el contenido de texto plano con las calificaciones actuales.
 * Formato: cabecera + una línea por calificación: "tipo\tidx\tcriterio\tvalor"
 */
function construirContenidoTXT() {
    const lineas = ['EVALUACION_IDEAS_V1'];
    document.querySelectorAll('.calif').forEach(input => {
        const { tipo, idx, crit } = input.dataset;
        lineas.push(`${tipo}\t${idx}\t${crit}\t${input.value}`);
    });
    return lineas.join('\n');
}

function guardarEvaluacionTXT() {
    saveData();

    const contenido = construirContenidoTXT();
    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = getEvaluacionFilename();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Aplica el contenido de un archivo .txt a las calificaciones ya presentes
 * en la tabla (los elementos a evaluar siguen viniendo de ideas.html;
 * este archivo solo repone las calificaciones, no crea elementos nuevos).
 */
function aplicarContenidoTXT(texto) {
    const lineas = texto
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l.length > 0 && !l.startsWith('EVALUACION_IDEAS'));

    lineas.forEach(linea => {
        let campos = linea.split('\t');
        if (campos.length < 4) {
            campos = linea.split(/[;,]/).map(c => c.trim());
        }
        if (campos.length < 4) return;

        const [tipo, idx, crit, valor] = campos;
        const input = document.querySelector(
            `input.calif[data-tipo="${tipo}"][data-idx="${idx}"][data-crit="${crit}"]`
        );
        if (input) input.value = valor;
    });

    // Recalcula el resultado de cada elemento con las calificaciones aplicadas
    obtenerElementos().forEach(({ tipo, idx }) => calcular(tipo, idx));
    saveData();
}

function cargarEvaluacionTXT(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            aplicarContenidoTXT(e.target.result);
        } catch (err) {
            console.error('Error al procesar el archivo de evaluación:', err);
            const msg = (typeof t === 'function' ? t('error_loading_file') : null) ||
                'No se pudo leer el archivo. Verifica que sea un archivo .txt válido generado por esta aplicación.';
            alert(msg);
        }
    };
    reader.onerror = function () {
        const msg = (typeof t === 'function' ? t('error_loading_file') : null) ||
            'No se pudo leer el archivo.';
        alert(msg);
    };
    reader.readAsText(file, 'utf-8');

    event.target.value = '';
}

// ========== BOTONES ==========

function setupButtons() {
    if (guardarBtn) guardarBtn.addEventListener('click', saveData);
    if (continuarBtn) continuarBtn.addEventListener('click', continueToNext);
    const anteriorBtn = document.getElementById('anteriorBtn');
    if (anteriorBtn) anteriorBtn.addEventListener('click', goToPrevious);

    // Botones de Cargar/Guardar Evaluación en archivo .txt
    const guardarEvaluacionBtn = document.getElementById('guardarEvaluacionBtn');
    const cargarEvaluacionBtn = document.getElementById('cargarEvaluacionBtn');
    const cargarEvaluacionInput = document.getElementById('cargarEvaluacionInput');

    if (guardarEvaluacionBtn) {
        guardarEvaluacionBtn.addEventListener('click', guardarEvaluacionTXT);
    }

    if (cargarEvaluacionBtn && cargarEvaluacionInput) {
        cargarEvaluacionBtn.addEventListener('click', () => cargarEvaluacionInput.click());
        cargarEvaluacionInput.addEventListener('change', cargarEvaluacionTXT);
    }
}

// ========== INICIALIZACIÓN ==========

function initializePage() {
    setupLanguageSelector();
    setupThemeToggle();
    setupButtons();
    updateProjectName();
    generarTablas();
    if (guardarBtn) guardarBtn.disabled = false;
    if (continuarBtn) continuarBtn.disabled = false;
}

document.addEventListener('DOMContentLoaded', initializePage);

// ========== EXPORTAR PARA USO GLOBAL ==========
window.updateProjectName = updateProjectName;
window.generarTablas = generarTablas;
window.calcular = calcular;
window.recalcularTodo = recalcularTodo;
window.saveData = saveData;
window.continueToNext = continueToNext;
window.claveCalif = claveCalif;
window.claveResultado = claveResultado;
window.obtenerElementos = obtenerElementos;
window.guardarEvaluacionTXT = guardarEvaluacionTXT;
window.cargarEvaluacionTXT = cargarEvaluacionTXT;
window.construirContenidoTXT = construirContenidoTXT;
window.aplicarContenidoTXT = aplicarContenidoTXT;
