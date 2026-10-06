/**
 * prevenir.html — Prevención de riesgos (estilo AMEF): por cada falla potencial se
 * captura efecto, severidad y ocurrencia (1-10); Riesgo = Severidad × Ocurrencia.
 * Arriba se muestra el "mejor concepto" (mayor resultado en evalConceptos).
 *
 * Guarda en projectData, para cada tabla n (1..numeroPrevenciones):
 *   fallaPotencial{n}, efecto{n}, sev{n}, ocu{n}, riesgo{n}, accionReal{n},
 *   responsable{n}, fechaCell{n} (fecha de hoy), accionTom{n}, fecha{n}
 *
 * ---------------------------------------------------------------------------
 * DOM (prevenir.html)
 *   #mejorConceptoContainer  recuadro del mejor concepto (se reescribe entero).
 *   #tablasContainer         contenedor de las tablas de prevención.
 *   #agregarTablaBtn         botón "agregar prevención".
 *   Generados aquí, por tabla: div.tabla-prevencion[data-tabla-id=n], .tabla-title,
 *   input[data-key="<campo><n>"] (texto/fecha), input.sev / input.ocu con
 *   data-tabla=n (type=number 1-10), button.btn-calc, span.riesgo#riesgo<n>,
 *   button.btn-eliminar-tabla (solo en tablas n > 1). Estilos: css/pages/prevenir.css.
 *   Botones comunes (#guardarBtn, #continuarBtn, #anteriorBtn): PFM.page.init.
 *
 * CLAVES DE projectData
 *   Lee:    resultado4..6 (evalConceptos.js) para el mejor concepto; concepto1..5;
 *           numeroPrevenciones y todos los campos por tabla.
 *   Escribe: numeroPrevenciones (nº de tablas) y, por tabla n, los campos de
 *           CAMPOS_TABLA: fallaPotencial, efecto, sev, ocu, riesgo, accionReal,
 *           responsable, fechaCell, accionTom, fecha (+ n). Los lee js/pdf/sections/prevencion.js.
 *   Riesgo = sev × ocu, guardado como texto con 2 decimales ('56.00').
 *
 * FLUJO
 *   Al cargar / cambiar idioma: generarContenido() (mejor concepto + tablas guardadas).
 *   El riesgo se recalcula al escribir en sev/ocu o al pulsar Calcular (delegación de
 *   eventos en #tablasContainer). Agregar tabla guarda de inmediato solo
 *   numeroPrevenciones; el resto de campos se guarda con Guardar/Continuar.
 *   Eliminar renumera las tablas restantes (1..n) y mueve sus claves.
 *
 * La composición del mejor concepto usa las mismas claves que gc1.js y el PDF:
 *   fila_grupo_<tipo>_<idx>_col<k> para cada elemento de PFM.elementos.getActivos(data).
 * ---------------------------------------------------------------------------
 */
(function () {
    'use strict';

    const t = PFM.i18n.t;
    const data = PFM.storage.load();
    const mejorConceptoContainer = document.getElementById('mejorConceptoContainer');
    const tablasContainer = document.getElementById('tablasContainer');
    const agregarTablaBtn = document.getElementById('agregarTablaBtn');

    // Nº de tablas actuales; coincide con data.numeroPrevenciones tras guardar. La tabla 1 siempre existe.
    let contadorTablas = 1;

    // Fecha de hoy 'AAAA-MM-DD' (formato de input type=date). CUIDADO: toISOString usa UTC,
    // así que cerca de medianoche puede dar el día anterior/siguiente según la zona horaria.
    const hoy = () => new Date().toISOString().split('T')[0];
    // Escapa & < > " ' para usar el texto dentro de value="..." o como contenido HTML.
    const attr = valor => PFM.html.escape(valor);

    // ---------- Mejor concepto ----------

    /**
     * Pinta el "mejor concepto": el concepto formado (1..3) con mayor resultado en
     * evalConceptos (resultado4..6) y su composición. Con todos los resultados en 0
     * (o ninguno) muestra "no_concept_selected".
     * La composición lista cada elemento (idea o función) con la opción elegida en gc1.html.
     */
    function generarMejorConcepto() {
        // CONFIGURABLE: [4,5,6] = resultado de los conceptos formados 1..3 (n+3, ver evalConceptos.js).
        // Si cambia NUM_CONCEPTOS_FORMADOS hay que ampliarlo. Empates: gana el primero (indexOf).
        const resultados = [4, 5, 6].map(n => parseFloat(data[`resultado${n}`]) || 0);
        let mejorIdx = resultados.indexOf(Math.max(...resultados));
        if (resultados.every(r => r === 0)) mejorIdx = -1;

        const mejorConceptoTexto = mejorIdx >= 0
            ? `${t('concept_formed')} ${mejorIdx + 1}`
            : t('no_concept_selected');

        // Composición: una línea por elemento (idea o función) con la opción que se eligió en gc1.html
        // para el concepto formado ganador (clave fila_grupo_<tipo>_<idx>_col<k> leída con PFM.elementos.getOpcionElegida, k = mejorIdx + 1).
        const opciones = [];
        if (mejorIdx >= 0) {
            PFM.elementos.getActivos(data).forEach(elem => {
                const seleccion = PFM.elementos.getOpcionElegida(data, elem.tipo, elem.idx, mejorIdx + 1).trim();
                const nombre = PFM.html.escape(elem.nombre);
                opciones.push(seleccion
                    ? `<strong>${nombre}</strong> ${PFM.html.escape(seleccion)}`
                    : `<strong>${nombre}</strong> <em>${t('no_selection')}</em>`);
            });
        }

        mejorConceptoContainer.innerHTML = `
            <div class="mejor-concepto">
                ${t('best_concept')}: ${mejorConceptoTexto}
            </div>
            ${mejorIdx >= 0 && opciones.length > 0 ? `
                <div class="opciones-list">
                    <strong>${t('concept_composition')}</strong>
                    <ul>
                        ${opciones.map(opcion => `<li>${opcion}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        `;
    }

    // ---------- Tablas de prevención ----------

    /**
     * HTML de una tabla de prevención. En una tabla nueva (esNueva) todo empieza
     * vacío, con riesgo 0.00 y la fecha de hoy; si no, se leen los datos guardados.
     */
    /**
     * Crea y añade al DOM la tabla de prevención `tablaId`. En una tabla nueva (esNueva)
     * todo empieza vacío, con riesgo 0.00 y la fecha de hoy; si no, se leen los datos guardados.
     * @param {number} tablaId  Número de tabla (1..n); sufijo de todas las claves de la tabla.
     * @param {boolean} esNueva true = tabla recién agregada (ignora lo guardado).
     */
    function generarTablaPrevencion(tablaId, esNueva) {
        // Valor guardado de un campo de esta tabla: clave = nombre del campo + tablaId (p. ej. 'efecto2').
        const valor = campo => (esNueva ? '' : (data[`${campo}${tablaId}`] || ''));

        // Plantillas de fila: `etiqueta` y `placeholder` son claves i18n (i18n/es.js y en.js).
        // data-key lleva la clave de projectData que saveData() escribe.
        const filaTexto = (campo, etiqueta, placeholder) => `
            <tr>
                <th>${t(etiqueta)}</th>
                <td><input type="text" data-key="${campo}${tablaId}" value="${attr(valor(campo))}" placeholder="${t(placeholder)}"></td>
            </tr>`;

        const filaFecha = (campo, etiqueta, valorFecha) => `
            <tr>
                <th>${t(etiqueta)}</th>
                <td><input type="date" data-key="${campo}${tablaId}" value="${valorFecha}"></td>
            </tr>`;

        // CONFIGURABLE: escala de severidad/ocurrencia min="1" max="10" step="1" (solo limita el input del
        // navegador; no se valida al calcular). La clase ('sev'/'ocu') es también el prefijo de la clave guardada.
        const filaNumero = (clase, etiqueta, placeholder) => `
            <tr>
                <th>${t(etiqueta)}</th>
                <td><input type="number" class="${clase}" data-tabla="${tablaId}" min="1" max="10" step="1" value="${valor(clase)}" placeholder="${t(placeholder)}"></td>
            </tr>`;

        // fechaCell = "fecha de hoy" de la tabla: por defecto hoy; si ya se guardó una, se respeta.
        const riesgo = esNueva ? '0.00' : (data[`riesgo${tablaId}`] || '0.00');
        const fechaCell = esNueva ? hoy() : (data[`fechaCell${tablaId}`] || hoy());

        const section = document.createElement('div');
        section.className = 'tabla-prevencion';
        section.setAttribute('data-tabla-id', tablaId);

        section.innerHTML = `
            <div class="tabla-title">${t('prevention')} ${tablaId}</div>
            <table>
                ${filaTexto('fallaPotencial', 'potential_failure', 'enter_task')}
                ${filaTexto('efecto', 'effect', 'enter_task')}
                ${filaNumero('sev', 'severity', 'enter_severity')}
                ${filaNumero('ocu', 'occurrence', 'enter_occurrence')}
            </table>

            <div class="calc-wrap">
                <button class="btn-calc">${t('risk_calculation')}</button>
            </div>

            <div class="riesgo-wrap">
                <div class="riesgo-cell">
                    <span class="riesgo-label">${t('risk')}:</span>
                    <span class="riesgo" id="riesgo${tablaId}">${riesgo}</span>
                </div>
            </div>

            <table>
                ${filaTexto('accionReal', 'actions_to_take', 'enter_task')}
                ${filaTexto('responsable', 'responsible', 'enter_responsible')}
                ${filaFecha('fechaCell', 'today_date', fechaCell)}
                ${filaTexto('accionTom', 'action_taken', 'enter_task')}
                ${filaFecha('fecha', 'action_date', valor('fecha'))}
            </table>

            <div class="tabla-buttons">
                ${tablaId > 1 ? '<button class="btn-eliminar-tabla">🗑️ Eliminar</button>' : ''}
            </div>
        `;
        tablasContainer.appendChild(section);
    }

    /** Redibuja las tablas guardadas (numeroPrevenciones, mínimo 1). */
    function cargarTablasGuardadas() {
        tablasContainer.innerHTML = '';
        const numTablas = data.numeroPrevenciones || 1;
        contadorTablas = numTablas;
        for (let i = 1; i <= numTablas; i++) generarTablaPrevencion(i, false);
    }

    /** Repinta toda la página (también se usa al cambiar de idioma; lo no guardado se pierde). */
    function generarContenido() {
        generarMejorConcepto();
        cargarTablasGuardadas();
    }

    /** Añade una tabla vacía al final y guarda el nuevo numeroPrevenciones. */
    // CONFIGURABLE: no hay límite máximo de tablas; para limitarlo, comprobar contadorTablas aquí.
    function agregarTabla() {
        contadorTablas++;
        generarTablaPrevencion(contadorTablas, true);
        data.numeroPrevenciones = contadorTablas;
        PFM.storage.save(data);
    }

    // Prefijos de TODAS las claves de una tabla (sufijo = nº de tabla). Eliminar y renumerar
    // solo conocen estos campos: si se añade una fila nueva al formulario, agregar aquí su
    // prefijo y en js/pdf/sections/prevencion.js, o quedará huérfana al eliminar.
    const CAMPOS_TABLA = ['fallaPotencial', 'efecto', 'sev', 'ocu', 'riesgo', 'accionReal',
        'responsable', 'fechaCell', 'accionTom', 'fecha'];

    /**
     * Elimina una tabla (previa confirmación traducida: clave i18n confirm_delete_prevention), borra sus
     * claves, actualiza numeroPrevenciones y renumera las restantes.
     * @param {number} tablaId Tabla a borrar (la 1 no tiene botón de eliminar).
     */
    function eliminarTabla(tablaId) {
        if (!confirm(t('confirm_delete_prevention'))) return;

        const tablaElement = document.querySelector(`.tabla-prevencion[data-tabla-id="${tablaId}"]`);
        if (!tablaElement) return;

        tablaElement.remove();
        CAMPOS_TABLA.forEach(campo => delete data[`${campo}${tablaId}`]);

        contadorTablas = document.querySelectorAll('.tabla-prevencion').length;
        data.numeroPrevenciones = contadorTablas;
        renumerarTablas();
        // saveData (no solo storage.save): vuelca los inputs con los números nuevos, sobre todo
        // sev/ocu, que no llevan data-key y por eso renumerarTablas no los mueve, y limpia sobrantes.
        saveData();
    }

    /** Tras eliminar, renumera las tablas restantes (1..n) y mueve sus datos a las claves nuevas. */
    function renumerarTablas() {
        let nuevoId = 1;
        document.querySelectorAll('.tabla-prevencion').forEach(tabla => {
            const oldId = parseInt(tabla.getAttribute('data-tabla-id'));
            tabla.setAttribute('data-tabla-id', nuevoId);

            const title = tabla.querySelector('.tabla-title');
            if (title) title.textContent = `${t('prevention')} ${nuevoId}`;

            tabla.querySelectorAll('input[data-key]').forEach(input => {
                // Cambia el número final de la clave ('efecto3' -> 'efecto2') y mueve el dato guardado.
                const oldKey = input.getAttribute('data-key');
                const newKey = oldKey.replace(/\d+$/, nuevoId);
                input.setAttribute('data-key', newKey);
                if (data[oldKey] !== undefined) {
                    data[newKey] = data[oldKey];
                    delete data[oldKey];
                }
            });

            tabla.querySelectorAll('.sev, .ocu').forEach(input => {
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
            nuevoId++;
        });
        contadorTablas = nuevoId - 1;
    }

    // ---------- Riesgo ----------

    /**
     * Riesgo = Severidad × Ocurrencia (valores vacíos o no numéricos cuentan como 0).
     * Rango típico 0-100 con escala 1-10. Se muestra y guarda en `data` (no persiste hasta Guardar).
     * @param {number} tabla Número de tabla.
     */
    function calcularRiesgo(tabla) {
        const sevInput = document.querySelector(`.sev[data-tabla="${tabla}"]`);
        const ocuInput = document.querySelector(`.ocu[data-tabla="${tabla}"]`);
        if (!sevInput || !ocuInput) return;

        const sev = parseFloat(sevInput.value) || 0;
        const ocu = parseFloat(ocuInput.value) || 0;
        const riesgo = (sev * ocu).toFixed(2);

        const riesgoElement = document.getElementById(`riesgo${tabla}`);
        if (riesgoElement) {
            riesgoElement.textContent = riesgo;
            data[`riesgo${tabla}`] = riesgo;
        }
    }

    // ---------- Guardar ----------

    /**
     * Borra de `data` las claves de tablas que ya no existen (número > contadorTablas), por ejemplo
     * 'sev3' u 'ocu3' que quedaban huérfanas al eliminar una tabla y que el PDF imprimía como
     * una prevención fantasma. Usa CAMPOS_TABLA para reconocer las claves de tabla.
     */
    function limpiarTablasSobrantes() {
        const patron = new RegExp(`^(${CAMPOS_TABLA.join('|')})(\\d+)$`);
        Object.keys(data).forEach(clave => {
            const m = patron.exec(clave);
            if (m && parseInt(m[2], 10) > contadorTablas) delete data[clave];
        });
    }

    /** Vuelca todos los inputs de las tablas a `data` y guarda (incluye numeroPrevenciones). */
    function saveData() {
        document.querySelectorAll('input[data-key]').forEach(input => {
            data[input.dataset.key] = input.value;
        });
        document.querySelectorAll('.sev').forEach(input => {
            data[`sev${input.dataset.tabla}`] = input.value;
        });
        document.querySelectorAll('.ocu').forEach(input => {
            data[`ocu${input.dataset.tabla}`] = input.value;
        });
        data.numeroPrevenciones = contadorTablas;
        limpiarTablasSobrantes();
        PFM.storage.save(data);
    }

    // ---------- Eventos (delegados: sirven aunque las tablas se vuelvan a dibujar) ----------

    /** Número de tabla (data-tabla-id) que contiene al elemento; null si no está en una tabla. */
    function idDeTabla(elemento) {
        const tabla = elemento.closest('.tabla-prevencion');
        return tabla ? parseInt(tabla.getAttribute('data-tabla-id')) : null;
    }

    /** Un solo listener por tipo de evento en el contenedor (delegación): vale para tablas añadidas luego. */
    function conectarEventosDeTablas() {
        tablasContainer.addEventListener('click', function (e) {
            const calc = e.target.closest('.btn-calc');
            if (calc) return calcularRiesgo(idDeTabla(calc));

            const eliminar = e.target.closest('.btn-eliminar-tabla');
            if (eliminar) eliminarTabla(idDeTabla(eliminar));
        });

        tablasContainer.addEventListener('input', function (e) {
            if (e.target.matches('.sev, .ocu') && e.target.dataset.tabla) {
                calcularRiesgo(parseInt(e.target.dataset.tabla));
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        PFM.page.init({
            page: 'prevenir.html',
            save: saveData,
            onLanguageChange: generarContenido
        });
        conectarEventosDeTablas();
        agregarTablaBtn.addEventListener('click', agregarTabla);
        generarContenido();
    });
})();
