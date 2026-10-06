/**
 * evalConceptos.html — Evalúa los 3 "conceptos formados" en gc1 contra los 5
 * criterios. Resultado = Σ calificación × peso.
 *
 * Guarda en projectData:
 *   ca1..ca15                 calificaciones (5 por concepto: concepto n usa ca{(n-1)*5+criterio})
 *   resultado4..6             resultado del concepto formado 1..3 (n + 3)
 *   calculadoFormado1..3      true si el resultado está vigente
 *
 * ---------------------------------------------------------------------------
 * DOM (evalConceptos.html)
 *   #tablasContainer   único contenedor; aquí se genera TODO: la lista de ideas
 *                      (.ideas-section) y una .concepto-section por concepto formado.
 *   Generados por este script (por concepto `conc`):
 *     input.calif[data-conc][data-crit]  calificación (type=number, 0-10, paso 0.1)
 *     span.resultado#res<conc>           resultado mostrado ('-' si no calculado)
 *     button.btn-calc[data-conc]         botón Calcular
 *   Botones comunes (#guardarBtn, #continuarBtn, #anteriorBtn): PFM.page.init.
 *
 * CLAVES DE projectData
 *   Lee:    fila_grupo_<tipo>_<idx>_col<k> (escritas por gc1.js; k = concepto formado; vía PFM.elementos.getOpcionElegida),
 *           elementosAEvaluar / concepto1..5 (vía PFM.elementos.getActivos),
 *           criterio1..5 y peso1..5 (necesidades.html, vía PFM.scoring).
 *   Escribe: ca1..ca15, resultado4..6 y calculadoFormado1..3 (ver arriba).
 *   Las leen prevenir.js (resultado4..6 para elegir el mejor concepto) y
 *   js/pdf/sections/evaluacion-conceptos.js y mejor-concepto.js.
 *   Nota: las claves eval_concepto_<n>_crit<k> NO son de esta página; son de
 *   evaluacion.js (evaluación de ideas). Aquí las calificaciones van en caN.
 *
 * FLUJO
 *   Al cargar / cambiar idioma: generarTablas() dibuja y recalcularTodo() rellena
 *   lo guardado. Calcular (por concepto) escribe ca/resultado/calculadoFormado en
 *   `data` PERO NO llama a PFM.storage.save: solo se persiste con Guardar o
 *   Continuar (saveData). Si el usuario cambia una calificación después de
 *   calcular, el resultado se invalida hasta volver a pulsar Calcular.
 *   saveData recalcula los conceptos que tienen notas escritas pero cuyo resultado se invalidó al editar
 *   (así Guardar/Continuar nunca dejan un resultado vacío que prevenir.js/PDF tratarían como 0).
 * ---------------------------------------------------------------------------
 */
(function () {
    'use strict';

    const t = PFM.i18n.t;
    const data = PFM.storage.load();
    const container = document.getElementById('tablasContainer');
    // CONFIGURABLE: nº de criterios (5) viene de shared/scoring.js; ahí se cambia (y en
    // necesidades/evaluacion/HTML). Determina las filas de cada tabla y el desplazamiento de ca{n}.
    const NUM_CRITERIOS = PFM.scoring.NUM_CRITERIOS;
    // CONFIGURABLE: nº de conceptos formados = columnas de gc1.js (COLUMNAS). Si se cambia,
    // actualizar gc1.js, el offset +3 de claveResultado/prevenir.js ([4,5,6]) y
    // js/pdf/sections/* (conceptos-formados, evaluacion-conceptos, mejor-concepto).
    const NUM_CONCEPTOS_FORMADOS = 3;

    // CUIDADO: ca{(conc-1)*NUM_CRITERIOS+crit} y resultado{conc+3} son formatos compartidos con
    // el PDF y prevenir.js. El +3 existe porque resultado1..3 son de las ideas (evaluacion.js).
    /** Clave de la calificación del criterio `crit` del concepto formado `conc`. */
    const claveCalif = (conc, crit) => `ca${(conc - 1) * NUM_CRITERIOS + crit}`;
    const claveResultado = conc => `resultado${conc + 3}`;

    /**
     * Opciones elegidas en gc1 para la columna `col` (una por elemento).
     * @param {number} col Concepto formado (1..NUM_CONCEPTOS_FORMADOS) = columna de gc1.
     * @returns {string[]} Textos actuales de las filas elegidas en gc1 (fila_grupo_<tipo>_<idx>_col<col>);
     *          se omiten vacíos.
     */
    function obtenerOpcionesSeleccionadas(col) {
        const opciones = [];
        PFM.elementos.getActivos(data).forEach(elem => {
            const opcion = PFM.elementos.getOpcionElegida(data, elem.tipo, elem.idx, col);
            if (opcion.trim() !== '') opciones.push(opcion);
        });
        return opciones;
    }

    // ---------- Tablas ----------

    /**
     * HTML de la lista de ideas/elementos evaluados (cabecera informativa).
     * @param {Array<{nombre:string}>} elementos Elementos activos.
     * @returns {string} Plantilla HTML; nombres escapados con PFM.html.escape.
     */
    function seccionIdeas(elementos) {
        return `
            <div class="ideas-section">
                <div class="section-title" data-i18n="ideas_concepts">Ideas</div>
                <div class="ideas-list">
                    <ul>${elementos.map(elem => `<li>${PFM.html.escape(elem.nombre || elem)}</li>`).join('')}</ul>
                </div>
            </div>
        `;
    }

    /**
     * Construye la sección de un concepto formado: opciones elegidas, tabla de
     * criterios x calificación y botón Calcular.
     * @param {number} conc Número de concepto formado (1..3).
     * @returns {HTMLDivElement} Sección lista para insertar.
     */
    function tablaConceptoFormado(conc) {
        const opciones = obtenerOpcionesSeleccionadas(conc);
        const opcionesHTML = opciones.length > 0
            ? opciones.map(opcion => `<li>${PFM.html.escape(opcion)}</li>`).join('')
            : `<li><em>${t('no_selection')}</em></li>`;

        // CUIDADO: filas 1..5 fijas (no usa NUM_CRITERIOS); debe coincidir con scoring.NUM_CRITERIOS.
        // CONFIGURABLE: min/max/step del input definen el rango de calificación (0-10, paso 0.1);
        // el rango NO se valida al calcular (solo lo limita el navegador al escribir con flechas).
        const filas = [1, 2, 3, 4, 5].map(i => `
            <tr>
                <td>${i}</td>
                <td>${PFM.html.escape(PFM.scoring.nombreCriterio(data, i))}</td>
                <td>
                    <input type="number" class="calif" data-conc="${conc}" data-crit="${i}"
                           min="0" max="10" step="0.1" value="${data[claveCalif(conc, i)] || ''}"
                           placeholder="${t('enter_rating')}" data-i18n-placeholder="enter_rating">
                </td>
                <td>${i === 1 ? `<span class="resultado" id="res${conc}">-</span>` : ''}</td>
            </tr>
        `).join('');

        const section = document.createElement('div');
        section.className = 'concepto-section';
        section.innerHTML = `
            <div class="concepto-title">${t('concept_formed')} ${conc}</div>
            <div class="opciones-list">
                <strong data-i18n="options_forming_concept">Opciones seleccionadas:</strong>
                <ul>${opcionesHTML}</ul>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th data-i18n="criteria">Criterio</th>
                        <th data-i18n="rating">Calificación (0-10)</th>
                        <th data-i18n="result">Resultado</th>
                    </tr>
                </thead>
                <tbody>${filas}</tbody>
            </table>
            <button class="btn-calc" data-conc="${conc}" data-i18n="calculate">Calcular</button>
        `;
        return section;
    }

    /**
     * Dibuja ideas + una tabla por concepto formado y conecta eventos.
     * Sin elementos activos muestra un aviso (clave i18n no_concepts_defined).
     */
    function generarTablas() {
        container.innerHTML = '';
        const elementos = PFM.elementos.getActivos(data);

        if (elementos.length === 0) {
            const message = document.createElement('div');
            message.className = 'no-conceptos-message';
            message.textContent = PFM.i18n.t('no_concepts_defined');
            container.appendChild(message);
            return;
        }

        container.innerHTML = seccionIdeas(elementos);
        for (let conc = 1; conc <= NUM_CONCEPTOS_FORMADOS; conc++) {
            container.appendChild(tablaConceptoFormado(conc));
        }

        PFM.i18n.applyTranslations();
        recalcularTodo();

        // Si cambia una calificación, el resultado anterior deja de ser válido
        container.querySelectorAll('.calif').forEach(input => {
            input.addEventListener('input', function () {
                const conc = parseInt(this.dataset.conc);
                if (data[`calculadoFormado${conc}`]) {
                    data[`calculadoFormado${conc}`] = false;
                    data[claveResultado(conc)] = null;
                    document.getElementById(`res${conc}`).textContent = '-';
                }
            });
        });

        container.querySelectorAll('.btn-calc').forEach(btn => {
            btn.addEventListener('click', () => calcular(parseInt(btn.dataset.conc)));
        });
    }

    // ---------- Cálculo ----------

    /**
     * Calcula el resultado ponderado de un concepto formado: Σ calificación_i × peso_i
     * (PFM.scoring.total). Calificación vacía se toma como 0 y se escribe '0' en el input.
     * Marca calculadoFormado<conc> = true. No persiste (ver cabecera).
     * @param {number} conc Concepto formado (1..3).
     */
    function calcular(conc) {
        const califs = [];
        for (let i = 1; i <= NUM_CRITERIOS; i++) {
            const input = document.querySelector(`input[data-conc="${conc}"][data-crit="${i}"]`);
            if (!input) { califs.push(0); continue; }
            if (input.value === '') input.value = '0';
            califs.push(input.value);
            data[claveCalif(conc, i)] = input.value;
        }

        const resultElement = document.getElementById(`res${conc}`);
        if (resultElement) {
            // Resultado = Σ calif × peso (pesos de necesidades.html); con pesos que suman 10 el máximo es 100.
            // Se guarda como TEXTO con 2 decimales (p. ej. '73.50').
            const resultado = PFM.scoring.total(data, califs).toFixed(2);
            resultElement.textContent = resultado;
            data[claveResultado(conc)] = resultado;
            data[`calculadoFormado${conc}`] = true;
        }
    }

    /** Muestra resultados y calificaciones guardados. */
    // Si hay resultado guardado, se muestra y se marca como vigente; si no, '-'.
    // Después se vuelcan las calificaciones guardadas a los inputs (si existe alguna ca{n}).
    function recalcularTodo() {
        for (let conc = 1; conc <= NUM_CONCEPTOS_FORMADOS; conc++) {
            const guardado = data[claveResultado(conc)];
            const resultElement = document.getElementById(`res${conc}`);
            if (guardado && resultElement) {
                resultElement.textContent = guardado;
                data[`calculadoFormado${conc}`] = true;
            } else if (resultElement) {
                resultElement.textContent = '-';
            }

            let hayCalificacionesGuardadas = false;
            for (let i = 1; i <= NUM_CRITERIOS; i++) {
                if (data[claveCalif(conc, i)] !== undefined) { hayCalificacionesGuardadas = true; break; }
            }
            if (hayCalificacionesGuardadas) {
                for (let i = 1; i <= NUM_CRITERIOS; i++) {
                    const input = document.querySelector(`input[data-conc="${conc}"][data-crit="${i}"]`);
                    const valor = data[claveCalif(conc, i)];
                    if (input && valor !== undefined) input.value = valor;
                }
            }
        }
    }

    // ---------- Guardar ----------

    /** Guarda las calificaciones de todos los inputs (vacío = '0'). Ver CUIDADO de la cabecera. */
    function saveData() {
        // Recalcula los conceptos con notas escritas cuyo resultado se invalidó al editar una calificación
        for (let conc = 1; conc <= NUM_CONCEPTOS_FORMADOS; conc++) {
            const hayNotas = [...document.querySelectorAll(`input.calif[data-conc="${conc}"]`)].some(i => i.value !== '');
            if (hayNotas && !data[`calculadoFormado${conc}`]) calcular(conc);
        }
        document.querySelectorAll('.calif').forEach(input => {
            const conc = parseInt(input.dataset.conc);
            const crit = parseInt(input.dataset.crit);
            if (conc && crit) {
                data[claveCalif(conc, crit)] = input.value === '' ? '0' : input.value;
            }
        });
        PFM.storage.save(data);
    }

    document.addEventListener('DOMContentLoaded', function () {
        PFM.page.init({
            page: 'evalConceptos.html',
            save: saveData,
            onLanguageChange: generarTablas
        });
        generarTablas();
    });
})();
