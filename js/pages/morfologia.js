/**
 * morfologia.html — Exploración de posibilidades: 3 posibilidades por cada
 * elemento seleccionado (ver shared/elementos.js).
 *
 * Guarda en projectData: pos_{tipo}_{idx}_{1..3}
 *
 * ---------------------------------------------------------------------------
 * DOM (morfologia.html)
 *   #tablasContainer   contenedor donde se generan las tablas (una por elemento).
 *   Clases generadas: .concepto-section, .concepto-title, .posibilidad (inputs de
 *   texto), .no-conceptos-message. Cada input lleva data-pos-key con su clave.
 *   Botones comunes (#guardarBtn, #continuarBtn, #anteriorBtn): PFM.page.init.
 *
 * CLAVES DE projectData
 *   Lee y escribe: pos_<tipo>_<idx>_<fila>, p. ej. pos_concepto_2_3 = opción 3
 *   del elemento idea nº 2; pos_tarea_1_1 = opción 1 de la función nº 1.
 *   Lee: elementosAEvaluar / concepto1..5 (vía PFM.elementos.getActivos).
 *   Esas claves las leen después gc1.js (casillas), evalConceptos.js (no directamente,
 *   usa fila_grupo) y js/pdf/sections/exploracion.js y formacion.js.
 *
 * FLUJO
 *   Al cargar / cambiar idioma: generarTablas() redibuja las tablas con lo guardado.
 *   Guardar / Continuar: saveData() copia todos los inputs a data y guarda.
 *   CUIDADO: al cambiar de idioma se redibuja desde `data`, por lo que el texto
 *   escrito y no guardado se pierde.
 * ---------------------------------------------------------------------------
 */
(function () {
    'use strict';

    const t = PFM.i18n.t;
    const data = PFM.storage.load();
    const container = document.getElementById('tablasContainer');
    // CONFIGURABLE: nº de posibilidades (filas) por elemento. Si se cambia hay que
    // cambiar A LA VEZ: FILAS en gc1.js (casillas/filas), el código de PDF que lee
    // pos_<tipo>_<idx>_<fila> (js/pdf/sections/exploracion.js, formacion.js y
    // js/pdf/grupos.js) y el texto de ayuda de la página si menciona "3".
    // Los proyectos ya guardados solo verían las filas que quepan en el nuevo valor.
    const POSIBILIDADES_POR_ELEMENTO = 3;

    /**
     * Dibuja una tabla de POSIBILIDADES_POR_ELEMENTO filas por cada elemento activo.
     * Si no hay elementos activos muestra un aviso (clave i18n no_concepts_defined).
     * Es HTML por plantillas: el valor guardado y el nombre pasan por PFM.html.escape.
     */
    function generarTablas() {
        container.innerHTML = '';
        // Elementos elegidos en seleccionEvaluar, o todas las ideas si no hay selección.
        const elementos = PFM.elementos.getActivos(data);

        if (elementos.length === 0) {
            const message = document.createElement('div');
            message.className = 'no-conceptos-message';
            message.textContent = PFM.i18n.t('no_concepts_defined');
            container.appendChild(message);
            return;
        }

        elementos.forEach(({ idx, nombre, tipo }) => {
            const section = document.createElement('div');
            section.className = 'concepto-section';

            const filas = [];
            for (let i = 1; i <= POSIBILIDADES_POR_ELEMENTO; i++) {
                // CUIDADO: formato de clave compartido con gc1.js, PDF y evalConceptos;
                // no cambiar el prefijo 'pos_' ni el orden tipo/idx/fila (rompe proyectos guardados).
                const posKey = `pos_${tipo}_${idx}_${i}`;
                filas.push(`
                    <tr>
                        <td>${t('options')} ${i}</td>
                        <td>
                            <input type="text" class="posibilidad"
                                   data-pos-key="${posKey}"
                                   value="${PFM.html.escape(data[posKey])}"
                                   placeholder="${t('enter_possibility')} ${i}">
                        </td>
                    </tr>
                `);
            }

            // data-i18n="possibilities" lo traduce applyTranslations() más abajo.
            section.innerHTML = `
                <div class="concepto-title">${PFM.html.escape(nombre)}</div>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th data-i18n="possibilities">Explorar posibilidades</th>
                        </tr>
                    </thead>
                    <tbody>${filas.join('')}</tbody>
                </table>
            `;
            container.appendChild(section);
        });

        PFM.i18n.applyTranslations();
    }

    /**
     * Guarda todas las posibilidades: cada input se escribe en la clave de su
     * data-pos-key (texto recortado; vacío se guarda como cadena vacía).
     */
    function saveData() {
        document.querySelectorAll('.posibilidad').forEach(input => {
            data[input.dataset.posKey] = input.value.trim();
        });
        PFM.storage.save(data);
    }

    document.addEventListener('DOMContentLoaded', function () {
        PFM.page.init({
            page: 'morfologia.html',
            save: saveData,
            onLanguageChange: generarTablas
        });
        generarTablas();
    });
})();
