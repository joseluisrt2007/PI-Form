/**
 * ============================================================================
 * shared/elementos.js  ->  PFM.elementos
 * ============================================================================
 * "Elementos" = las ideas/conceptos y las funciones del diagrama que el usuario
 * eligió en seleccionEvaluar.html para explorarlas (morfología, gc1, evalConceptos).
 *
 * Cada elemento es { tipo: 'concepto' | 'tarea', idx: número, nombre: texto }.
 * Las claves de projectData que dependen de él se construyen así:
 *   posibilidad:      pos_{tipo}_{idx}_{1..3}
 *   opción elegida:   fila_grupo_{tipo}_{idx}_col{1..3} = NÚMERO de fila (1..3) elegida en gc1
 *                     (formato antiguo, solo lectura/migración: pastel_grupo_{tipo}_{idx}_col{k} = texto)
 *
 * API PÚBLICA (PFM.elementos):
 *   MAX_IDEAS         -> 5       nº máximo de ideas (concepto1..concepto5)
 *   getIdeas(data)    -> Array<{tipo:'concepto', idx, nombre}>   ideas con texto
 *   getActivos(data)  -> Array<{idx, nombre, tipo}>              elementos seleccionados o, si no hay, las ideas
 *   getFilaElegida(data, tipo, idx, col) -> number | null        fila elegida en gc1 (lee también el formato antiguo)
 *   getOpcionElegida(data, tipo, idx, col) -> string             texto ACTUAL de esa fila ('' si no hay elección)
 *   migrarSelecciones(data) -> boolean                           convierte pastel_grupo_* (texto) a fila_grupo_* (nº);
 *                                                                devuelve true si cambió algo (el llamador guarda)
 *   (`data` = resultado de PFM.storage.load())
 *
 * USADO POR: pages/evaluacion.js, seleccionEvaluar.js, morfologia.js, gc1.js, evalConceptos.js.
 * Sin dependencias (solo recibe `data`). Orden de carga: después de core/*, antes de js/pages/*.
 *
 * localStorage (vía `data`): lee concepto1..5 (escribe ideas.html) y elementosAEvaluar
 *   ([{idx, nombre, tipo}], escribe seleccionEvaluar.html). No escribe nada.
 * ============================================================================
 */
(function (PFM) {
    'use strict';

    // CONFIGURABLE: máximo de ideas. Ojo: es un valor duplicado en otros sitios; al cambiarlo
    // hay que actualizar también NUM_IDEAS en js/pages/ideas.js, las filas/inputs de ideas.html,
    // el límite `i <= 5` de buildContext en js/features/assistant.js y las secciones del PDF
    // que recorren concepto1..N.
    const MAX_IDEAS = 5;

    /**
     * Ideas con contenido (concepto1..5), como elementos de tipo 'concepto'.
     * @param {Object} data  projectData.
     * @returns {Array<{tipo:string, idx:number, nombre:string}>} Se omiten las ideas vacías;
     *          `idx` conserva el número original (1..5) aunque haya huecos.
     */
    function getIdeas(data) {
        const ideas = [];
        for (let i = 1; i <= MAX_IDEAS; i++) {
            const nombre = (data[`concepto${i}`] || '').trim();
            if (nombre) ideas.push({ tipo: 'concepto', idx: i, nombre });
        }
        return ideas;
    }

    /**
     * Elementos activos para morfología / gc1 / evalConceptos: los guardados en
     * seleccionEvaluar (data.elementosAEvaluar) o, si no hay selección, todas las ideas.
     * @param {Object} data  projectData.
     * @returns {Array<{idx:number, nombre:string, tipo:string}>}
     */
    function getActivos(data) {
        const seleccionados = data.elementosAEvaluar || [];
        if (seleccionados.length > 0) {
            // Copia solo los 3 campos conocidos (descarta cualquier otro dato guardado).
            return seleccionados.map(e => ({ idx: e.idx, nombre: e.nombre, tipo: e.tipo }));
        }
        // Sin selección (módulo de exploración sin pasar por seleccionEvaluar): todas las ideas.
        return getIdeas(data);
    }

    // CONFIGURABLE: nº de posibilidades por elemento; debe coincidir con FILAS de gc1.js y
    // POSIBILIDADES_POR_ELEMENTO de morfologia.js.
    const FILAS = 3;

    const claveFila = (tipo, idx, col) => `fila_grupo_${tipo}_${idx}_col${col}`;
    const claveAntigua = (tipo, idx, col) => `pastel_grupo_${tipo}_${idx}_col${col}`;
    const clavePos = (tipo, idx, fila) => `pos_${tipo}_${idx}_${fila}`;

    /** Fila (1..FILAS) cuyo texto actual es `texto`, o null (en empate gana la primera). */
    function filaConTexto(data, tipo, idx, texto) {
        if (!texto) return null;
        for (let f = 1; f <= FILAS; f++) {
            if (data[clavePos(tipo, idx, f)] === texto) return f;
        }
        return null;
    }

    /**
     * Fila elegida en gc1 para el elemento y la columna (concepto formado) dados.
     * Si solo existe el formato antiguo (texto), la deduce comparando con las posibilidades actuales.
     * @returns {number|null} null = sin elección.
     */
    function getFilaElegida(data, tipo, idx, col) {
        const fila = parseInt(data[claveFila(tipo, idx, col)], 10);
        if (fila >= 1 && fila <= FILAS) return fila;
        return filaConTexto(data, tipo, idx, data[claveAntigua(tipo, idx, col)]);
    }

    /** Texto actual de la posibilidad elegida ('' si no hay elección o la posibilidad está vacía). */
    function getOpcionElegida(data, tipo, idx, col) {
        const fila = getFilaElegida(data, tipo, idx, col);
        return fila ? (data[clavePos(tipo, idx, fila)] || '') : '';
    }

    /**
     * Convierte las claves antiguas pastel_grupo_<tipo>_<idx>_col<k> (texto) en fila_grupo_... (número).
     * Si el texto antiguo ya no coincide con ninguna posibilidad, la elección se descarta
     * (la casilla ya aparecía desmarcada en esa situación).
     * @returns {boolean} true si modificó `data`.
     */
    function migrarSelecciones(data) {
        let cambio = false;
        Object.keys(data).forEach(k => {
            const m = /^pastel_grupo_(.+)_(\d+)_col(\d+)$/.exec(k);
            if (!m) return;
            const [, tipo, idx, col] = m;
            if (data[claveFila(tipo, idx, col)] === undefined) {
                const fila = filaConTexto(data, tipo, idx, data[k]);
                if (fila) data[claveFila(tipo, idx, col)] = String(fila);
            }
            delete data[k];
            cambio = true;
        });
        return cambio;
    }

    PFM.elementos = { MAX_IDEAS, getIdeas, getActivos, getFilaElegida, getOpcionElegida, migrarSelecciones };
})(window.PFM = window.PFM || {});
