/**
 * gc1.html — Formación de conceptos. Para cada elemento hay una matriz de
 * casillas: filas = sus 3 posibilidades (de morfologia), columnas = 3
 * "conceptos formados". En cada columna se elige UNA posibilidad.
 *
 * Guarda en projectData (al marcar cada casilla):
 *   fila_grupo_{tipo}_{idx}_col{1..3} = NÚMERO de fila (1..3) de la posibilidad elegida
 *
 * ---------------------------------------------------------------------------
 * DOM (gc1.html)
 *   #tablasContainer   contenedor de las tablas (una por elemento activo).
 *   Clases generadas: .concepto-section, .concepto-title, .chk (checkbox),
 *   .posibilidad (celda con el texto), .no-conceptos-message.
 *   Cada .chk lleva data-elem="<tipo>_<idx>", data-col="<1..3>" y
 *   data-pos-key="pos_<tipo>_<idx>_<fila>" (la posibilidad de su fila).
 *   Los <th> de columna llevan data-i18n-col para traducir "Opción N".
 *
 * CLAVES DE projectData
 *   Lee:    pos_<tipo>_<idx>_<fila> (de morfologia), elementosAEvaluar.
 *   Escribe: fila_grupo_<tipo>_<idx>_col<k> = NÚMERO de fila elegida (se guarda la fila,
 *            no el texto: editar la posibilidad en morfologia no desmarca la casilla y dos
 *            posibilidades con el mismo texto no se confunden).
 *   Las lee, vía PFM.elementos.getOpcionElegida, evalConceptos.js, prevenir.js y js/pdf/grupos.js.
 *   MIGRACIÓN: al cargar, PFM.elementos.migrarSelecciones convierte el formato antiguo
 *   (pastel_grupo_* = texto) en fila_grupo_* y lo guarda; así siguen abriendo los
 *   archivos de proyecto guardados con versiones anteriores.
 *
 * FLUJO
 *   Al cargar / cambiar de idioma: generarTablas() dibuja y marca lo guardado.
 *   Cada casilla guarda al instante (alCambiarCasilla); Guardar/Continuar solo
 *   vuelve a volcar `data` (no hay nada pendiente).
 * ---------------------------------------------------------------------------
 */
(function () {
    'use strict';

    const t = PFM.i18n.t;
    const data = PFM.storage.load();
    const container = document.getElementById('tablasContainer');
    // CONFIGURABLE: filas = posibilidades (debe coincidir con POSIBILIDADES_POR_ELEMENTO
    // de morfologia.js) y columnas = conceptos formados (debe coincidir con
    // NUM_CONCEPTOS_FORMADOS de evalConceptos.js, con [4,5,6] en prevenir.js
    // y con el bucle de conceptos formados de js/pdf/sections/*). Si se cambian,
    // actualizar todos a la vez; también el texto "Opción N" de i18n.
    const FILAS = [1, 2, 3];
    const COLUMNAS = [1, 2, 3];

    /**
     * Dibuja, por cada elemento activo, una tabla con FILAS x COLUMNAS casillas
     * y marca las ya guardadas. Plantillas HTML; los textos del usuario pasan por PFM.html.escape.
     */
    function generarTablas() {
        container.innerHTML = '';
        const elementos = PFM.elementos.getActivos(data);

        if (elementos.length === 0) {
            const message = document.createElement('div');
            message.className = 'no-conceptos-message';
            message.textContent = 'No hay conceptos definidos. Regresa a la página anterior para ingresar conceptos.';
            container.appendChild(message);
            return;
        }

        elementos.forEach(({ idx, nombre, tipo }) => {
            // Identificador del elemento dentro de las claves: "<tipo>_<idx>".
            const elemId = `${tipo}_${idx}`;
            const section = document.createElement('div');
            section.className = 'concepto-section';

            const filas = FILAS.map(row => {
                // Clave de la posibilidad de esta fila (creada en morfologia.js).
                const posKey = `pos_${tipo}_${idx}_${row}`;
                const casillas = COLUMNAS.map(col => `
                    <td>
                        <input type="checkbox" class="chk"
                               data-elem="${elemId}" data-col="${col}"
                               data-pos-key="${posKey}" data-fila="${row}">
                    </td>`).join('');
                return `
                    <tr>
                        <td>${row}</td>
                        ${casillas}
                        <td class="posibilidad">${data[posKey] ? PFM.html.escape(data[posKey]) : `${t('options')} ${row}`}</td>
                    </tr>`;
            }).join('');

            section.innerHTML = `
                <div class="concepto-title">${PFM.html.escape(nombre)}</div>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            ${COLUMNAS.map(c => `<th data-i18n-col="${c}">Opción ${c}</th>`).join('')}
                            <th data-i18n="possibilities">Posibilidades</th>
                        </tr>
                    </thead>
                    <tbody>${filas}</tbody>
                </table>
            `;
            container.appendChild(section);
        });

        PFM.i18n.applyTranslations();
        traducirEncabezadosDeColumna();
        configurarCheckboxes();
    }

    /** Encabezados "Opción N" de las columnas (dependen del idioma). */
    function traducirEncabezadosDeColumna() {
        document.querySelectorAll('thead th[data-i18n-col]').forEach(th => {
            th.textContent = `${t('option')} ${th.getAttribute('data-i18n-col')}`;
        });
    }

    /**
     * Marca las casillas ya elegidas y conecta los cambios.
     * Una casilla está marcada si la fila guardada para su columna (fila_grupo_...)
     * es la de la casilla.
     */
    function configurarCheckboxes() {
        document.querySelectorAll('.chk').forEach(chk => {
            const { elem, col, fila } = chk.dataset;
            // CUIDADO: formato de clave compartido con PFM.elementos (js/shared/elementos.js).
            const groupKey = `fila_grupo_${elem}_col${col}`;

            if (String(data[groupKey]) === fila) chk.checked = true;
            chk.addEventListener('change', () => alCambiarCasilla(chk, elem, col, fila, groupKey));
        });
    }

    /**
     * En cada columna solo una casilla puede estar marcada; se guarda al instante.
     * @param {HTMLInputElement} checkbox Casilla pulsada.
     * @param {string} elem Identificador "<tipo>_<idx>" del elemento.
     * @param {string} col Columna (conceptos formado) como texto "1".."3".
     * @param {string} fila Número de fila de la casilla pulsada ("1".."3").
     * @param {string} groupKey Clave fila_grupo_... donde se guarda la elección.
     */
    function alCambiarCasilla(checkbox, elem, col, fila, groupKey) {
        // Las casillas de la misma columna y elemento (comportamiento tipo radio).
        const columna = document.querySelectorAll(`.chk[data-elem="${elem}"][data-col="${col}"]`);

        if (checkbox.checked) {
            columna.forEach(other => { if (other !== checkbox) other.checked = false; });
            // Se guarda el número de fila (si su posibilidad está vacía, los lectores la ignoran).
            data[groupKey] = fila;
        } else if (!Array.from(columna).some(c => c.checked)) {
            // Se desmarcó la última casilla: se elimina la clave.
            delete data[groupKey];
        }
        PFM.storage.save(data);
    }

    document.addEventListener('DOMContentLoaded', function () {
        PFM.page.init({
            page: 'gc1.html',
            save: () => PFM.storage.save(data),
            onLanguageChange: generarTablas
        });
        // Convierte selecciones guardadas con el formato antiguo (texto) antes de dibujar.
        if (PFM.elementos.migrarSelecciones(data)) PFM.storage.save(data);
        generarTablas();
    });
})();
