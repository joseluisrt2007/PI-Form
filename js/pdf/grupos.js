/**
 * Datos de "conceptos formados" para el informe: qué opción se eligió en gc1
 * para cada elemento y cada columna (concepto formado 1..3).
 * No dibuja nada: es un proveedor de datos para formacion.js, conceptos-formados.js,
 * mejor-concepto.js (generarGruposDinamicos) y exploracion.js (conceptosExistentes).
 * Depende del módulo exploracionConceptos (lo activa quien llama; aquí no hay enabled).
 * Claves de projectData que lee: elementosAEvaluar ([{tipo, idx, nombre}], de seleccionEvaluar),
 * concepto1..5 (ideas), fila_grupo_<tipo>_<idx>_col1..3 (escritas por gc1). Sin textos i18n.
 *
 * Nota: conceptosExistentes() devuelve objetos {tipo, idx, nombre} (los mismos elementos que
 * usan morfologia.js y gc1.js, vía PFM.elementos.getActivos). Requiere cargar
 * js/shared/elementos.js antes que este archivo (ver resultados.html).
 */
(function (PFM) {
    'use strict';

    /**
     * Elementos sobre los que se explora y se forman conceptos en el informe.
     * Son los mismos que ven morfologia.html y gc1.html: los guardados en
     * data.elementosAEvaluar (ideas y funciones elegidas en seleccionEvaluar.html) o,
     * si no hay selección, todas las ideas con texto (concepto1..5).
     * @param {Object} data  projectData.
     * @returns {Array<{tipo:string, idx:number, nombre:string}>}
     */
    function conceptosExistentes(data) {
        return PFM.elementos.getActivos(data);
    }

    /**
     * Construye, para cada concepto formado (col1..col3), la lista de ideas con la opción
     * que el usuario eligió en gc1.html. Lo usan formacion.js, conceptos-formados.js y mejor-concepto.js.
     * Lee: data.fila_grupo_<tipo>_<idx>_col<K> (fila elegida, vía PFM.elementos.getOpcionElegida), data.concepto<idx> (nombre).
     * @returns {{col1:Array, col2:Array, col3:Array}} cada elemento = { nombreConcepto, seleccion|null }
     * CONFIGURABLE: las 3 columnas (col1..col3 y [1, 2, 3] más abajo) deben coincidir con
     * ctx.NUM_CONCEPTOS_FORMADOS (context.js) y con las columnas de gc1.html.
     */
    function generarGruposDinamicos(data) {
        const grupos = { col1: [], col2: [], col3: [] };

        conceptosExistentes(data).forEach(elem => {
            // Nombre a mostrar: nombre guardado > texto de la idea > "<tipo> <idx>" de respaldo
            const nombreElem = elem.nombre || data[`concepto${elem.idx}`] || `${elem.tipo} ${elem.idx}`;

            // Una entrada por cada concepto formado (columna 1..3 de gc1)
            [1, 2, 3].forEach(col => {
                grupos[`col${col}`].push({
                    nombreConcepto: nombreElem,
                    // null = no se eligió opción para esta idea en esta columna
                    seleccion: PFM.elementos.getOpcionElegida(data, elem.tipo, elem.idx, col) || null
                });
            });
        });

        return grupos;
    }

    // API pública: PFM.pdf.grupos.conceptosExistentes / generarGruposDinamicos
    PFM.pdf = PFM.pdf || {};
    PFM.pdf.grupos = { conceptosExistentes, generarGruposDinamicos };
})(window.PFM = window.PFM || {});
