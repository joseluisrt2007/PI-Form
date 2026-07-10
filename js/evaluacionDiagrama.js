// ========== EVALUACIÓN DE FUNCIONES DEL DIAGRAMA ==========
// Lee las tareas seleccionadas en seleccionEvaluar.html
// (data.elementosAEvaluar filtrando tipo === 'tarea')
// y genera una tabla de evaluación por cada una.

const data = JSON.parse(localStorage.getItem('projectData') || '{}');
const tablasContainer = document.getElementById('tablasContainer');
const guardarBtn = document.getElementById('guardarBtn');
const continuarBtn = document.getElementById('continuarBtn');

// ========== UTILIDADES ==========

function updateProjectName() {
    const el = document.getElementById('projectNameText');
    if (!el) return;
    el.textContent = (data.projectName || '').trim()
        || (typeof t === 'function' ? t('unnamed_project') : null)
        || '(Sin nombre)';
}

function updateThemeButton() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.textContent = dark ? '☀️' : '🌙';
    btn.title = dark
        ? ((typeof t === 'function' ? t('theme_light') : null) || 'Cambiar a modo claro')
        : ((typeof t === 'function' ? t('theme_dark') : null) || 'Cambiar a modo oscuro');
}

function setupLanguageSelector() {
    const sel = document.getElementById('languageSelector');
    if (!sel) return;
    sel.value = localStorage.getItem('preferredLanguage') || 'es';
    sel.addEventListener('change', function () {
        if (typeof setLanguage === 'function') {
            setLanguage(this.value);
            updateProjectName();
            updateThemeButton();
            applyDynamicTranslations();
        }
    });
}

function setupThemeToggle() {
    const btn = document.getElementById('themeToggle');
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeButton();
    if (btn) {
        btn.addEventListener('click', () => {
            const cur = document.documentElement.getAttribute('data-theme');
            const next = cur === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            updateThemeButton();
        });
    }
}

// ========== ELEMENTOS A EVALUAR ==========

/**
 * Devuelve solo las tareas que el usuario seleccionó
 * en seleccionEvaluar.html.
 */
function obtenerElementos() {
    return (data.elementosAEvaluar || []).filter(e => e.tipo === 'tarea');
}

function claveCalif(tipo, idx, crit) {
    return `eval_${tipo}_${idx}_crit${crit}`;
}

function claveResultado(tipo, idx) {
    return `eval_resultado_${tipo}_${idx}`;
}

// ========== TABLAS ==========

function generarTablas() {
    if (!tablasContainer) return;
    tablasContainer.innerHTML = '';

    const elementos = obtenerElementos();

    if (elementos.length === 0) {
        const msg = document.createElement('div');
        msg.className = 'no-conceptos-message';
        msg.textContent = 'No hay funciones seleccionadas para evaluar. '
            + 'Regresa y selecciona al menos una.';
        tablasContainer.appendChild(msg);
        return;
    }

    elementos.forEach(({ tipo, idx, nombre }) => {
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
                    ${[1,2,3,4,5].map(i => `
                        <tr>
                            <td>${i}</td>
                            <td>${data[`criterio${i}`] || `Criterio ${i}`}</td>
                            <td>
                                <input type="number" class="calif"
                                    data-tipo="${tipo}" data-idx="${idx}" data-crit="${i}"
                                    min="0" max="10" step="0.1"
                                    value="${data[claveCalif(tipo, idx, i)] || ''}">
                            </td>
                            <td>${i === 1 ? `<span class="resultado" id="${resId}">-</span>` : ''}</td>
                        </tr>`).join('')}
                </tbody>
            </table>
            <button class="btn-calc" data-tipo="${tipo}" data-idx="${idx}"
                    data-i18n="calculate">Calcular</button>
        `;
        tablasContainer.appendChild(section);
    });

    applyDynamicTranslations();
    recalcularTodo();

    document.querySelectorAll('.calif').forEach(input => {
        input.addEventListener('input', function () {
            const { tipo, idx } = this.dataset;
            const el = document.getElementById(`res_${tipo}_${idx}`);
            if (el) el.textContent = '-';
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
    const el = document.getElementById(`res_${tipo}_${idx}`);
    if (el) el.textContent = resultado;
    data[claveResultado(tipo, idx)] = resultado;
}

function recalcularTodo() {
    obtenerElementos().forEach(({ tipo, idx }) => {
        const guardado = data[claveResultado(tipo, idx)];
        const el = document.getElementById(`res_${tipo}_${idx}`);
        if (el) el.textContent = guardado || '-';
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
    window.location.href = getNextPage('evaluacionDiagrama.html');
}

function goToPrevious() {
    window.location.href = getPreviousPage('evaluacionDiagrama.html');
}

// ========== BOTONES ==========

function setupButtons() {
    if (guardarBtn) guardarBtn.addEventListener('click', saveData);
    if (continuarBtn) continuarBtn.addEventListener('click', continueToNext);
    const anteriorBtn = document.getElementById('anteriorBtn');
    if (anteriorBtn) anteriorBtn.addEventListener('click', goToPrevious);
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

window.saveData = saveData;
window.continueToNext = continueToNext;
