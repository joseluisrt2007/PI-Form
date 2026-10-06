/**
 * evaluacion.html — Califica (0-10) cada idea frente a los 5 criterios.
 * Resultado = Σ calificación × peso.
 *
 * Guarda en projectData:
 *   eval_{tipo}_{idx}_crit{n}   calificación
 *   eval_resultado_{tipo}_{idx} resultado calculado (texto con 2 decimales)
 * Permite guardar/cargar como .txt (EVALUACION_IDEAS_V1) y recibe el contenido
 * del asistente de IA (PFM.page.importText).
 *
 * DOM que usa (evaluacion.html):
 *   #tablasContainer      contenedor donde se generan las tablas (una por idea)
 *   input.calif[data-tipo][data-idx][data-crit]   celda de calificación (generada aquí)
 *   button.btn-calc[data-tipo][data-idx]          botón "Calcular" de cada tabla
 *   span#res_{tipo}_{idx}                         donde se muestra el resultado
 *   #guardarEvaluacionBtn, #cargarEvaluacionBtn, #cargarEvaluacionInput (file oculto)
 *   #guardarBtn / #continuarBtn / #anteriorBtn    los conecta PFM.page.init
 *
 * Significado de las claves (todas en projectData):
 *   tipo   aquí siempre 'concepto' (las ideas de ideas.html). El formato admite también
 *          'tarea' porque evalConceptos/PDF comparten el esquema con las funciones.
 *   idx    número de la idea (1..5, es el N de conceptoN)
 *   crit   número de criterio (1..5)
 *   Ejemplo: eval_concepto_2_crit3 = "7.5" -> calificación de la idea 2 en el criterio 3.
 *            eval_resultado_concepto_2 = "54.30".
 *   También lee criterio1..5 (nombres) y peso1..5 (vía PFM.scoring) de necesidades.
 *   El PDF (js/pdf/evaluacion-elementos.js) lee eval_{tipo}_{idx}_crit{i}.
 *
 * Flujo: al cargar genera una tabla por idea con texto -> el usuario escribe
 * calificaciones y pulsa "Calcular" -> Guardar/Continuar vuelcan todo a localStorage.
 * Orden de carga (ver evaluacion.html): shared/elementos.js y shared/scoring.js antes de este script.
 *
 * Guardar/Continuar recalculan automáticamente las ideas que tienen calificaciones escritas pero no
 * resultado vigente (por ejemplo, si se editó una nota y no se pulsó "Calcular").
 * Los nombres de ideas y criterios se escapan con PFM.html.escape antes de ir a innerHTML.
 */
(function () {
    'use strict';

    const t = PFM.i18n.t;
    const data = PFM.storage.load();

    // CONFIGURABLE: viene de shared/scoring.js (5). Para cambiar el nº de criterios ver
    // la nota en necesidades.js; aquí además está fijo el arreglo [1, 2, 3, 4, 5] de
    // generarTablas, que NO usa esta constante y hay que editar a mano.
    const NUM_CRITERIOS = PFM.scoring.NUM_CRITERIOS;

    // CUIDADO: prefijo de cabecera del .txt; al importar se filtra por 'EVALUACION_IDEAS'.
    const TXT_HEADER = 'EVALUACION_IDEAS_V1';
    const container = document.getElementById('tablasContainer');

    // Constructores de claves de projectData. CUIDADO: estos formatos los leen también
    // js/pdf/evaluacion-elementos.js y otras secciones; no cambiarlos sin actualizarlos.
    const claveCalif = (tipo, idx, crit) => `eval_${tipo}_${idx}_crit${crit}`;
    const claveResultado = (tipo, idx) => `eval_resultado_${tipo}_${idx}`;
    // Busca el input de una celda por sus atributos data-* (los pone generarTablas)
    const califInput = (tipo, idx, crit) =>
        document.querySelector(`input[data-tipo="${tipo}"][data-idx="${idx}"][data-crit="${crit}"]`);

    /**
     * Elementos a evaluar: las ideas definidas en ideas.html.
     * @returns {Array<{tipo:string, idx:number, nombre:string}>} solo ideas con texto.
     */
    function obtenerElementos() {
        return PFM.elementos.getIdeas(data);
    }

    // ---------- Tablas ----------

    /**
     * Dibuja una tabla por idea (criterios x calificación) dentro de #tablasContainer
     * y conecta sus eventos. Se llama al cargar la página.
     */
    function generarTablas() {
        container.innerHTML = '';
        const elementos = obtenerElementos();

        // Sin ideas: mensaje informativo
        // Aviso traducido (clave i18n no_elements_to_evaluate).
        if (elementos.length === 0) {
            const message = document.createElement('div');
            message.className = 'no-conceptos-message';
            message.textContent = PFM.i18n.t('no_elements_to_evaluate');
            container.appendChild(message);
            return;
        }

        elementos.forEach(({ tipo, idx, nombre }) => {
            const section = document.createElement('div');
            section.className = 'concepto-section';
            // Plantilla de la tarjeta de una idea:
            //  - .concepto-title: nombre de la idea
            //  - una fila por criterio: número, nombre del criterio (o "Criterio N" si está
            //    vacío), input de calificación y, solo en la fila 1, el span del resultado
            //  - botón "Calcular" que identifica la idea con data-tipo / data-idx
            section.innerHTML = `
                <div class="concepto-title">${PFM.html.escape(nombre)}</div>
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
                                <td>${PFM.html.escape(data[`criterio${i}`] || `Criterio ${i}`)}</td>
                                <td>
                                    <input type="number" class="calif"
                                           data-tipo="${tipo}" data-idx="${idx}" data-crit="${i}"
                                           min="0" max="10" step="0.1"
                                           value="${data[claveCalif(tipo, idx, i)] || ''}">
                                </td>
                                <td>${i === 1 ? `<span class="resultado" id="res_${tipo}_${idx}">-</span>` : ''}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <button class="btn-calc" data-tipo="${tipo}" data-idx="${idx}"
                        data-i18n="calculate">Calcular</button>
            `;
            container.appendChild(section);
        });

        // Traduce los data-i18n de las tablas recién insertadas
        PFM.i18n.applyTranslations();
        mostrarResultadosGuardados();

        // Si el usuario cambia una calificación, el resultado anterior deja de ser válido
        container.querySelectorAll('.calif').forEach(input => {
            input.addEventListener('input', function () {
                const { tipo, idx } = this.dataset;
                document.getElementById(`res_${tipo}_${idx}`).textContent = '-';
                delete data[claveResultado(tipo, idx)];
            });
        });

        container.querySelectorAll('.btn-calc').forEach(btn => {
            btn.addEventListener('click', function () {
                calcular(this.dataset.tipo, this.dataset.idx);
            });
        });
    }

    /** Muestra en cada tabla el resultado guardado (o '-' si aún no se calculó). */
    function mostrarResultadosGuardados() {
        obtenerElementos().forEach(({ tipo, idx }) => {
            const el = document.getElementById(`res_${tipo}_${idx}`);
            if (el) el.textContent = data[claveResultado(tipo, idx)] || '-';
        });
    }

    /**
     * Calcula y guarda (en memoria) el resultado de una idea: Σ calificación × peso.
     * Las celdas vacías se rellenan con '0'. No escribe en localStorage; eso lo hace saveData.
     * @param {string} tipo 'concepto' (viene de data-tipo).
     * @param {string|number} idx número de la idea.
     */
    function calcular(tipo, idx) {
        const califs = [];
        for (let i = 1; i <= NUM_CRITERIOS; i++) {
            const input = califInput(tipo, idx, i);
            // Sin input (p. ej. importado de una idea que ya no existe): cuenta como 0
            if (!input) { califs.push(0); continue; }
            if (input.value === '') input.value = '0';
            califs.push(input.value);
            data[claveCalif(tipo, idx, i)] = input.value;
        }

        // Fórmula (ver shared/scoring.js): suma de calificación_i * peso_i para i=1..5.
        // Con calificaciones 0-10 y pesos que suman 10 el máximo es 100.
        // toFixed(2): se guarda como TEXTO con 2 decimales (p. ej. "54.30").
        const resultado = PFM.scoring.total(data, califs).toFixed(2);
        const el = document.getElementById(`res_${tipo}_${idx}`);
        if (el) el.textContent = resultado;
        data[claveResultado(tipo, idx)] = resultado;
    }

    // ---------- Guardar ----------

    /** Vuelca todas las calificaciones a data y guarda en localStorage (Guardar / Continuar). */
    function saveData() {
        // Si una idea tiene notas escritas pero su resultado se invalidó al editar, se recalcula antes de guardar
        obtenerElementos().forEach(({ tipo, idx }) => {
            const hayNotas = [1, 2, 3, 4, 5].some(i => {
                const input = califInput(tipo, idx, i);
                return input && input.value !== '';
            });
            if (hayNotas && !data[claveResultado(tipo, idx)]) calcular(tipo, idx);
        });
        document.querySelectorAll('.calif').forEach(input => {
            const { tipo, idx, crit } = input.dataset;
            if (tipo && idx && crit) {
                // Celda vacía se guarda como '0'
                data[claveCalif(tipo, idx, crit)] = input.value === '' ? '0' : input.value;
            }
        });
        PFM.storage.save(data);
    }

    // ---------- Exportar / importar .txt ----------

    /**
     * Cabecera + una línea por celda: "tipo<TAB>idx<TAB>criterio<TAB>calificación".
     * Ej.: "concepto\t2\t3\t7.5". Recorre todos los inputs .calif presentes en pantalla.
     */
    function construirContenidoTXT() {
        const lineas = [TXT_HEADER];
        document.querySelectorAll('.calif').forEach(input => {
            const { tipo, idx, crit } = input.dataset;
            lineas.push(`${tipo}\t${idx}\t${crit}\t${input.value}`);
        });
        return lineas.join('\n');
    }

    /** Guarda el proyecto y descarga el .txt (nombre: <proyecto>_evaluacion_ideas.txt). */
    function guardarEvaluacionTXT() {
        saveData();
        const base = PFM.fileIO.safeName(data.projectName, 'evaluacion');
        PFM.fileIO.downloadText(`${base}_evaluacion_ideas.txt`, construirContenidoTXT());
    }

    /**
     * Rellena las calificaciones desde un .txt, recalcula todos los resultados y guarda.
     * Solo se aplican líneas cuyo (tipo, idx, crit) corresponda a un input existente;
     * el resto se ignora sin avisar. También lo usa el asistente de IA.
     * @param {string} texto contenido completo del archivo.
     */
    function aplicarContenidoTXT(texto) {
        PFM.fileIO.contentLines(texto, 'EVALUACION_IDEAS').forEach(linea => {
            // 4 campos; el 3.er parámetro true recorta espacios si se separó por ; o ,
            const campos = PFM.fileIO.splitFields(linea, 4, true);
            if (campos.length < 4) return;

            const [tipo, idx, crit, valor] = campos;
            const input = document.querySelector(
                `input.calif[data-tipo="${tipo}"][data-idx="${idx}"][data-crit="${crit}"]`
            );
            // No se valida el rango 0-10 al importar (solo el atributo min/max del HTML)
            if (input) input.value = valor;
        });

        obtenerElementos().forEach(({ tipo, idx }) => calcular(tipo, idx));
        saveData();
    }

    document.addEventListener('DOMContentLoaded', function () {
        PFM.page.init({ page: 'evaluacion.html', save: saveData });
        generarTablas();

        document.getElementById('guardarEvaluacionBtn')
            .addEventListener('click', guardarEvaluacionTXT);

        // Botón visible "Cargar" -> abre el <input type=file> oculto -> readSelectedFile lo lee
        const cargarBtn = document.getElementById('cargarEvaluacionBtn');
        const cargarInput = document.getElementById('cargarEvaluacionInput');
        cargarBtn.addEventListener('click', () => cargarInput.click());
        cargarInput.addEventListener('change', event =>
            PFM.fileIO.readSelectedFile(event, aplicarContenidoTXT, 'evaluación'));

        PFM.page.importText = aplicarContenidoTXT; // lo usa el asistente de IA
    });
})();
