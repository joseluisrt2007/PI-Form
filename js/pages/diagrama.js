/**
 * diagrama.html — Diagrama de funciones: filas "Entrada → Función → Salida".
 * Las celdas y las flechas se pueden ocultar con un clic (para presentar el
 * diagrama con partes en blanco).
 *
 * Guarda en projectData:
 *   persona{n}, tarea{n}, salida{n}        entrada, función y salida de la fila n
 *   numeroTareas                           cantidad de filas
 *   celda_oculta_{tipo}_{n}                true si esa celda está oculta
 *   flecha_vertical_oculta_{n}             true si la flecha entre la fila n y n+1 está oculta
 * Las funciones (tarea{n}) también pueden pasar a seleccionEvaluar.html.
 *
 * DOM que usa (diagrama.html):
 *   #tareasBody         <tbody> donde se generan las filas y las flechas verticales
 *   #agregarTareaBtn    botón "+ Agregar fila" (texto traducido por traducirBotonAgregar)
 *   #guardarBtn / #continuarBtn / #anteriorBtn   los conecta PFM.page.init
 *   Clases generadas aquí: tr.fila-principal[data-fila-id], tr.flecha-vertical-row[data-flecha-id],
 *   td.celda-clickable[data-tipo][data-fila], input.{persona|tarea|salida}-input[data-key],
 *   button.btn-eliminar-fila; estados .celda-oculta, .flecha-vertical-oculta (css/pages/diagrama.css).
 *
 * Claves de projectData: la fila n (1..numeroTareas) usa persona{n}, tarea{n}, salida{n}
 *   (texto SIN trim, máx. 30 caracteres). Las claves celda_oculta_* y flecha_vertical_oculta_*
 *   guardan booleanos; ausente/false = visible. tipo puede ser: numero, persona, flecha1,
 *   tarea, flecha2, salida, eliminar (ver TIPOS_CELDA). Ejemplo: celda_oculta_tarea_2 = true.
 *   Las leen seleccionEvaluar.js (tarea{n}, numeroTareas) y js/pdf/sections/plan-accion.js
 *   (persona/tarea/salida).
 *
 * Flujo: al cargar dibuja numeroTareas filas (mínimo 1) -> cada input guarda al cambiar
 * ('change', al perder foco) y cada clic en celda/flecha guarda en el momento -> "Agregar fila"
 * añade una fila vacía -> eliminar una fila renumera las siguientes. Guardar/Continuar
 * (guardar) solo vuelcan `data` a localStorage; no hay validación.
 *
 * Seguridad: el texto del usuario se escapa (escaparHTML) antes de ir a innerHTML al ocultar una celda.
 * Textos: '👆 Click para mostrar...' salen de i18n (click_to_show, click_to_show_arrow).
 * Límite: agregarNuevaFila() no crea más de MAX_FILAS filas.
 */
(function () {
    'use strict';

    const t = PFM.i18n.t;
    const data = PFM.storage.load();
    const tareasBody = document.getElementById('tareasBody');
    const agregarTareaBtn = document.getElementById('agregarTareaBtn');

    // CONFIGURABLE: máximo de filas de la tabla. agregarNuevaFila() no crea más, y los bucles de
    // limpieza/renumeración (eliminarFila, reconstruirTabla) recorren hasta este número, así que
    // ninguna clave queda sin mover ni borrar. Subirlo no requiere tocar otro archivo.
    const MAX_FILAS = 50;

    /**
     * Escapa & < > " ' para insertar texto del usuario dentro de innerHTML sin que se interprete como HTML.
     * @param {*} texto  Valor a escapar (se convierte a texto).
     * @returns {string}
     */
    function escaparHTML(texto) {
        return String(texto).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }
    /** Columnas de cada fila, en orden. */
    const TIPOS_CELDA = ['numero', 'persona', 'flecha1', 'tarea', 'flecha2', 'salida', 'eliminar'];
    // Nº de columnas de la tabla (= TIPOS_CELDA.length y los <th> de diagrama.html); la fila de
    // flecha vertical ocupa todo el ancho con este colspan. Cambiar columnas implica cambiar ambos.
    const COLSPAN = '7';

    // Nº de filas actuales (también el id de la última fila); se sincroniza con data.numeroTareas
    let contadorFilas = 0;

    // Guarda `data` completo en localStorage (también es la función `save` de PFM.page.init)
    const guardar = () => PFM.storage.save(data);
    // Constructores de claves de ocultación. CUIDADO: formato leído al repintar; renombrar
    // dejaría ocultos/visibles de forma inconsistente los proyectos ya guardados.
    const claveOculta = (tipo, fila) => `celda_oculta_${tipo}_${fila}`;
    const claveFlechaOculta = fila => `flecha_vertical_oculta_${fila}`;

    // ---------- Flechas verticales (entre filas) ----------

    /**
     * Dibuja la flecha vertical según esté oculta o visible (la clase CSS cambia el aspecto).
     * @param {HTMLTableCellElement} celda  td de la flecha.
     * @param {number} fila  Fila de origen (la flecha va entre `fila` y `fila + 1`).
     */
    function pintarFlechaVertical(celda, fila) {
        if (data[claveFlechaOculta(fila)]) {
            celda.className = 'flecha-vertical-oculta';
            celda.innerHTML = `<div class="mensaje-oculto">${escaparHTML(t('click_to_show_arrow'))}</div>`;
        } else {
            celda.className = 'flecha-vertical-clickable';
            celda.innerHTML = '↓';
        }
    }

    /**
     * Añade al final de #tareasBody una fila-separador con la flecha ↓ clicable.
     * @param {number} filaOrigen  Número de la fila superior; también es el data-flecha-id y el
     *   N de flecha_vertical_oculta_N.
     */
    function agregarFlechaVertical(filaOrigen) {
        const tr = document.createElement('tr');
        tr.className = 'flecha-vertical-row';
        tr.setAttribute('data-flecha-id', filaOrigen);

        const celda = document.createElement('td');
        celda.setAttribute('colspan', COLSPAN);
        celda.setAttribute('data-flecha-id', filaOrigen);
        pintarFlechaVertical(celda, filaOrigen);

        // Un clic alterna oculta/visible y guarda al instante (no espera al botón Guardar)
        celda.addEventListener('click', function (e) {
            e.stopPropagation();
            data[claveFlechaOculta(filaOrigen)] = !data[claveFlechaOculta(filaOrigen)];
            pintarFlechaVertical(celda, filaOrigen);
            guardar();
        });

        tr.appendChild(celda);
        tareasBody.appendChild(tr);
    }

    // ---------- Celdas ocultables ----------

    /**
     * Texto guía (traducido) del input de cada tipo de celda.
     * @param {string} tipo  'persona' | 'tarea' | 'salida'.
     * @returns {string|undefined} claves i18n enter_responsible / enter_task / enter_salida.
     */
    function placeholderDe(tipo) {
        return { persona: t('enter_responsible'), tarea: t('enter_task'), salida: t('enter_salida') }[tipo];
    }

    /**
     * Crea el <input> de una celda editable y lo conecta para guardar.
     * @param {string} tipo  'persona' | 'tarea' | 'salida'.
     * @param {number} fila  Número de fila.
     * @param {string} valor  Texto inicial.
     * @param {string} placeholder  Texto guía.
     * @returns {HTMLInputElement}
     */
    function crearInput(tipo, fila, valor, placeholder) {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = valor;
        input.placeholder = placeholder;
        // CONFIGURABLE: longitud máxima del texto de cada celda (el diagrama y el PDF
        // plan-accion.js tienen poco ancho; subirla puede desbordar el diseño).
        input.maxLength = 30;
        // data-key = clave de projectData donde se guarda: persona{n} / tarea{n} / salida{n}
        input.setAttribute('data-key', `${tipo}${fila}`);
        input.classList.add(`${tipo}-input`);
        // El aspecto (medidas, colores, hover/foco y el resaltado de la columna Función)
        // lo da css/pages/diagrama.css: `td input[type="text"]` y `.tarea-input`.
        // 'change' se dispara al salir del campo, no en cada tecla
        input.addEventListener('change', function () {
            data[this.getAttribute('data-key')] = this.value;
            guardar();
        });
        return input;
    }

    /**
     * Dibuja el contenido de una celda: oculto (mensaje) o visible (input / texto).
     * @param {HTMLTableCellElement} celda  td a (re)pintar.
     * @param {{tipo:string, fila:number, contenido:string, esInput:boolean, placeholder?:string}} spec
     *   Descripción de la celda; `contenido` es el texto/valor inicial (se captura al crearla).
     * @param {boolean} oculta  true para mostrar solo el aviso "Click para mostrar".
     */
    function pintarCelda(celda, spec, oculta) {
        const { tipo, fila, contenido, esInput, placeholder } = spec;
        celda.classList.toggle('celda-oculta', oculta);

        if (oculta) {
            // HTML por plantilla: el contenido real queda en .contenido-oculto (el CSS lo difumina/
            // oculta) y se añade el aviso. CUIDADO: `contenido` es el valor de cuando se creó la
            // celda, no lo escrito después en el input.
            celda.innerHTML = `
                <div class="contenido-oculto">${escaparHTML(contenido)}</div>
                <div class="mensaje-oculto">${escaparHTML(t('click_to_show'))}</div>
            `;
        } else if (esInput) {
            celda.innerHTML = '';
            celda.appendChild(crearInput(tipo, fila, contenido, placeholder));
        } else {
            celda.innerHTML = escaparHTML(contenido);
            // Flechas horizontales y número de fila: su aspecto está en diagrama.css (.flecha y .celda-numero)
            if (tipo === 'flecha1' || tipo === 'flecha2') {
                celda.classList.add('flecha');
            }
            if (tipo === 'numero') {
                celda.classList.add('celda-numero');
            }
        }
    }

    /**
     * Crea un <td> que alterna entre visible y oculto al hacer clic (para presentar el
     * diagrama con huecos). Estado inicial leído de celda_oculta_{tipo}_{fila}.
     * @param {{tipo:string, fila:number, contenido:string, esInput:boolean, placeholder?:string}} spec
     * @returns {HTMLTableCellElement}
     */
    function crearCeldaOcultable(spec) {
        const { tipo, fila } = spec;
        const celda = document.createElement('td');
        celda.className = 'celda-clickable';
        celda.setAttribute('data-tipo', tipo);
        celda.setAttribute('data-fila', fila);

        pintarCelda(celda, spec, data[claveOculta(tipo, fila)] || false);

        celda.addEventListener('click', function (e) {
            // Clic dentro del input = editar, no alternar ocultación
            if (e.target.tagName === 'INPUT') return;
            const nuevoEstado = !(data[claveOculta(tipo, fila)] || false);
            data[claveOculta(tipo, fila)] = nuevoEstado;
            pintarCelda(celda, spec, nuevoEstado);
            guardar();
        });
        return celda;
    }

    // ---------- Filas ----------

    /**
     * Añade al final de #tareasBody la fila n: número, entrada, →, función, →, salida y 🗑️.
     * @param {number} fila  Número de fila (1..).
     * @param {boolean} esNueva  true = campos vacíos; false = rellena desde projectData.
     */
    function agregarFilaPrincipal(fila, esNueva) {
        const valor = tipo => (esNueva ? '' : (data[`${tipo}${fila}`] || ''));

        const row = document.createElement('tr');
        row.setAttribute('data-fila-id', fila);
        row.className = 'fila-principal';

        // Orden de columnas = TIPOS_CELDA y los <th> de diagrama.html. Solo persona/tarea/salida
        // son editables; las flechas '→' son texto fijo.
        row.appendChild(crearCeldaOcultable({ tipo: 'numero', fila, contenido: fila.toString(), esInput: false }));
        ['persona', 'flecha1', 'tarea', 'flecha2', 'salida'].forEach(tipo => {
            const esInput = ['persona', 'tarea', 'salida'].includes(tipo);
            row.appendChild(crearCeldaOcultable({
                tipo,
                fila,
                contenido: esInput ? valor(tipo) : '→',
                esInput,
                placeholder: esInput ? placeholderDe(tipo) : ''
            }));
        });

        const celdaEliminar = document.createElement('td');
        celdaEliminar.setAttribute('data-tipo', 'eliminar');
        celdaEliminar.setAttribute('data-fila', fila);
        const btnEliminar = document.createElement('button');
        btnEliminar.textContent = '🗑️';
        btnEliminar.className = 'btn-eliminar-fila';
        btnEliminar.setAttribute('data-id', fila);
        btnEliminar.addEventListener('click', function (e) {
            // La celda 'eliminar' no es ocultable, pero se evita burbujear por si acaso.
            e.stopPropagation();
            eliminarFila(fila);
        });
        celdaEliminar.appendChild(btnEliminar);
        row.appendChild(celdaEliminar);

        tareasBody.appendChild(row);
    }

    /** Dibuja todas las filas guardadas (al menos una). */
    function cargarFilasGuardadas() {
        tareasBody.innerHTML = '';
        // CONFIGURABLE: nº de filas inicial si no hay datos guardados (1 = una fila vacía).
        const numFilas = data.numeroTareas || 1;
        contadorFilas = numFilas;

        for (let i = 1; i <= numFilas; i++) {
            // Entre la fila i-1 y la i va una flecha vertical (id = fila superior)
            if (i > 1) agregarFlechaVertical(i - 1);
            agregarFilaPrincipal(i, false);
        }
    }

    /** Botón "+ Agregar fila": añade una fila vacía al final y guarda numeroTareas. */
    function agregarNuevaFila() {
        // Tope de filas (MAX_FILAS): evita crear filas cuyas claves los bucles de borrado no alcanzan
        if (contadorFilas >= MAX_FILAS) return;
        contadorFilas++;
        if (contadorFilas > 1) agregarFlechaVertical(contadorFilas - 1);
        agregarFilaPrincipal(contadorFilas, true);
        data.numeroTareas = contadorFilas;
        guardar();
    }

    // ---------- Eliminar y renumerar ----------

    /** Borra todos los datos guardados de la fila n. */
    function borrarDatosDeFila(n) {
        delete data[`persona${n}`];
        delete data[`tarea${n}`];
        delete data[`salida${n}`];
        TIPOS_CELDA.forEach(tipo => delete data[claveOculta(tipo, n)]);
        delete data[claveFlechaOculta(n)];
    }

    /** Mueve los datos guardados de la fila `desde` a la fila `hasta`. */
    function moverDatosDeFila(desde, hasta) {
        ['persona', 'tarea', 'salida'].forEach(campo => {
            if (data[`${campo}${desde}`] !== undefined) {
                data[`${campo}${hasta}`] = data[`${campo}${desde}`];
                delete data[`${campo}${desde}`];
            }
        });
        TIPOS_CELDA.forEach(tipo => {
            if (data[claveOculta(tipo, desde)] !== undefined) {
                data[claveOculta(tipo, hasta)] = data[claveOculta(tipo, desde)];
                delete data[claveOculta(tipo, desde)];
            }
        });
        if (data[claveFlechaOculta(desde)] !== undefined) {
            data[claveFlechaOculta(hasta)] = data[claveFlechaOculta(desde)];
            delete data[claveFlechaOculta(desde)];
        }
    }

    /**
     * Elimina la fila n del DOM y de projectData, y desplaza hacia arriba las siguientes.
     * @param {number} fila  Número de la fila a borrar.
     */
    function eliminarFila(fila) {
        const row = document.querySelector(`tr.fila-principal[data-fila-id="${fila}"]`);
        if (!row) return;

        row.remove();
        // La flecha que quita es la de arriba (entre fila-1 y fila); en la fila 1 no existe
        const flechaAntes = document.querySelector(`.flecha-vertical-row[data-flecha-id="${fila - 1}"]`);
        if (flechaAntes) flechaAntes.remove();

        delete data[`persona${fila}`];
        delete data[`tarea${fila}`];
        delete data[`salida${fila}`];
        TIPOS_CELDA.forEach(tipo => delete data[claveOculta(tipo, fila)]);
        delete data[claveFlechaOculta(fila - 1)];

        // Recorre hacia arriba los datos de las filas siguientes. Límite: MAX_FILAS.
        // (El DOM se renumera después en reconstruirTabla leyendo data-fila-id viejos.)
        for (let i = fila + 1; i <= MAX_FILAS; i++) moverDatosDeFila(i, i - 1);

        reconstruirTabla();
        guardar();
    }

    /** Vuelve a numerar y a dibujar las filas que quedan en pantalla. */
    function reconstruirTabla() {
        const filasRestantes = document.querySelectorAll('tr.fila-principal');

        // Si se borró la última fila, se reinicia a una fila vacía (nunca queda la tabla sin filas)
        if (filasRestantes.length === 0) {
            contadorFilas = 1;
            data.numeroTareas = 1;
            for (let i = 1; i <= MAX_FILAS; i++) borrarDatosDeFila(i);
            guardar();
            cargarFilasGuardadas();
            return;
        }

        // 1) Copia en memoria el contenido de cada fila restante según su id viejo (en orden de pantalla)
        const filasData = [];
        filasRestantes.forEach(fila => {
            const oldId = parseInt(fila.getAttribute('data-fila-id'));
            const info = {
                persona: data[`persona${oldId}`] || '',
                tarea: data[`tarea${oldId}`] || '',
                salida: data[`salida${oldId}`] || '',
                celdasOcultas: {}
            };
            TIPOS_CELDA.forEach(tipo => {
                if (data[claveOculta(tipo, oldId)]) info.celdasOcultas[tipo] = true;
            });
            filasData.push(info);
        });

        // 2) Limpia tabla y claves, 3) reescribe todo con ids consecutivos 1..N y redibuja
        tareasBody.innerHTML = '';
        for (let i = 1; i <= MAX_FILAS; i++) borrarDatosDeFila(i);

        contadorFilas = filasData.length;
        data.numeroTareas = contadorFilas;

        filasData.forEach((info, i) => {
            const nuevoId = i + 1;
            // Los textos vacíos no se guardan (así no quedan claves '' en projectData)
            if (info.persona) data[`persona${nuevoId}`] = info.persona;
            if (info.tarea) data[`tarea${nuevoId}`] = info.tarea;
            if (info.salida) data[`salida${nuevoId}`] = info.salida;
            Object.keys(info.celdasOcultas).forEach(tipo => {
                data[claveOculta(tipo, nuevoId)] = true;
            });

            if (nuevoId > 1) agregarFlechaVertical(nuevoId - 1);
            agregarFilaPrincipal(nuevoId, false);
        });

        guardar();
    }

    // ---------- Textos dependientes del idioma ----------

    /** Escribe el texto traducido del botón "+ Agregar fila" (clave i18n add_row). */
    function traducirBotonAgregar() {
        agregarTareaBtn.innerHTML = `+ ${t('add_row')}`;
    }

    document.addEventListener('DOMContentLoaded', function () {
        PFM.page.init({
            page: 'diagrama.html',
            save: guardar,
            // Tras cambiar de idioma se redibuja todo para actualizar los placeholders
            onLanguageChange: function () {
                traducirBotonAgregar();
                cargarFilasGuardadas();
            }
        });

        cargarFilasGuardadas();
        traducirBotonAgregar();
        agregarTareaBtn.addEventListener('click', agregarNuevaFila);
    });
})();
