/**
 * seleccionEvaluar.html — El usuario elige qué ideas y/o funciones del diagrama
 * pasan a morfología, formación de conceptos y su evaluación. También puede
 * renombrarlas (lápiz).
 *
 * Guarda en projectData: elementosAEvaluar = [{ tipo, idx, nombre }, ...]
 * (existir en la lista = estar seleccionado).
 *
 * ---------------------------------------------------------------------------
 * DOM (seleccionEvaluar.html)
 *   #elementosContainer  contenedor donde se pintan los grupos de tarjetas.
 *   #sinElementosMsg     aviso "no hay elementos"; se oculta si hay al menos uno.
 *   Clases creadas aquí (estilos en css/pages/seleccionEvaluar.css):
 *     .grupo-modulo, .grupo-modulo-titulo, .elemento-card (+ .seleccionado),
 *     .elemento-nombre-texto, .elemento-nombre-input, .btn-editar (+ .editando).
 *   Botones comunes (#guardarBtn, #continuarBtn, #anteriorBtn) los conecta PFM.page.init.
 *
 * CLAVES DE projectData
 *   Lee:    modulosSeleccionados (definicionIdeas / diagrama),
 *           concepto1..5 (vía PFM.elementos.getIdeas), numeroTareas y tarea{i}
 *           (escritas por diagrama.js), elementosAEvaluar (selección previa).
 *   Escribe: elementosAEvaluar (solo los marcados). Formato de cada elemento:
 *           { tipo: 'concepto' | 'tarea', idx: número, nombre: texto }.
 *   Quien consume elementosAEvaluar: PFM.elementos.getActivos (morfologia, gc1,
 *   evalConceptos), js/pdf/grupos.js y varias secciones del PDF. Las claves
 *   pos_<tipo>_<idx>_<fila> y fila_grupo_<tipo>_<idx>_col<k> se construyen con
 *   el MISMO tipo e idx que se guardan aquí.
 *
 * FLUJO
 *   Al cargar: PFM.page.init (idioma, tema, botones) y renderizarElementos().
 *   Al cambiar de idioma: se vuelve a pintar (onLanguageChange), reconstruyendo
 *   las tarjetas desde `data` (los cambios sin guardar de la sesión se pierden).
 *   Guardar / Continuar: saveData() reescribe elementosAEvaluar y Continuar
 *   navega a la página siguiente del flujo (PFM.flow; normalmente morfologia.html).
 *
 * RELACIÓN CON elementosAEvaluar
 *   Si el usuario no guarda ninguna selección (lista vacía), PFM.elementos.getActivos
 *   usa por defecto TODAS las ideas (concepto1..5); las funciones del diagrama
 *   (tipo 'tarea') SOLO entran si se marcan aquí.
 *   CUIDADO: renombrar una tarjeta cambia únicamente el nombre dentro de
 *   elementosAEvaluar; NO modifica concepto{n} ni tarea{n} (ideas.html/diagrama.html).
 * ---------------------------------------------------------------------------
 */
(function () {
    'use strict';

    const t = PFM.i18n.t;
    // Copia en memoria de projectData; se modifica y se vuelve a guardar completa.
    const data = PFM.storage.load();

    /**
     * Fuentes de elementos; cada una depende de que su módulo esté activo.
     *
     * CONFIGURABLE: para añadir otro origen de elementos (p. ej. otro módulo)
     * agrega aquí un objeto { tipo, moduloRequerido, labelKey, obtenerElementos }.
     * Además hay que: (1) añadir la clave labelKey en i18n/es.js e i18n/en.js,
     * (2) declarar el módulo en descripcion.js/flow.js si es nuevo, y (3) revisar
     * js/pdf/* (grupos.js y secciones), que filtran elementosAEvaluar por
     * tipo 'concepto' o 'tarea' y ignorarían un tipo desconocido.
     * El valor de `tipo` forma parte de las claves pos_/fila_grupo_ ya guardadas:
     * cambiarlo deja huérfanos los datos existentes.
     */
    const FUENTES = [
        {
            tipo: 'concepto',
            // Nombre de la bandera en modulosSeleccionados que debe ser true.
            moduloRequerido: 'definicionIdeas',
            // Clave i18n del título del grupo.
            labelKey: 'select_group_ideas',
            obtenerElementos: () => PFM.elementos.getIdeas(data)
        },
        {
            tipo: 'tarea',
            moduloRequerido: 'diagrama',
            labelKey: 'select_group_tasks',
            /** Funciones del diagrama con texto: tarea1..numeroTareas (vacías se omiten). */
            obtenerElementos: () => {
                const elementos = [];
                // numeroTareas lo guarda diagrama.js (nº de filas); 0 si no existe.
                const numTareas = parseInt(data.numeroTareas) || 0;
                for (let i = 1; i <= numTareas; i++) {
                    const nombre = (data[`tarea${i}`] || '').trim();
                    if (nombre) elementos.push({ tipo: 'tarea', idx: i, nombre });
                }
                return elementos;
            }
        }
    ];

    /** Estado de cada tarjeta pintada: { tipo, idx, nombre, checked, ... } */
    let tarjetas = [];

    /**
     * Crea la tarjeta (checkbox + nombre editable) de un elemento.
     * Modifica el objeto `entry` en vivo (checked / nombre) y le añade las
     * referencias cardEl e inputEl; saveData() lee después ese estado.
     * @param {{tipo:string, idx:number, nombre:string, checked:boolean}} entry Estado del elemento.
     * @returns {HTMLDivElement} Tarjeta lista para insertar en el DOM.
     */
    function crearTarjeta(entry) {
        const card = document.createElement('div');
        card.className = 'elemento-card' + (entry.checked ? ' seleccionado' : '');
        card.dataset.tipo = entry.tipo;
        card.dataset.idx = entry.idx;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = entry.checked;

        const textoNombre = document.createElement('span');
        textoNombre.className = 'elemento-nombre-texto';
        textoNombre.textContent = entry.nombre;

        // Campo de edición oculto hasta pulsar el lápiz.
        const inputNombre = document.createElement('input');
        inputNombre.type = 'text';
        inputNombre.className = 'elemento-nombre-input';
        inputNombre.value = entry.nombre;
        inputNombre.style.display = 'none';

        const btnEditar = document.createElement('button');
        btnEditar.type = 'button';
        btnEditar.className = 'btn-editar';
        // CONFIGURABLE: textos fijos en español (no pasan por i18n); para traducirlos
        // habría que crear claves en i18n/es.js y en.js y usar t().
        btnEditar.title = 'Editar nombre';
        btnEditar.innerHTML = '✏️';
        btnEditar.setAttribute('aria-label', 'Editar nombre del elemento');

        /** Sincroniza checkbox, estado (entry.checked) y estilo de la tarjeta. */
        function marcar(valor) {
            checkbox.checked = valor;
            entry.checked = valor;
            card.classList.toggle('seleccionado', valor);
        }

        checkbox.addEventListener('change', () => marcar(checkbox.checked));
        // Pulsar en cualquier parte de la tarjeta alterna la selección, salvo en los
        // controles propios (evita doble alternancia con el checkbox).
        card.addEventListener('click', e => {
            if (e.target === checkbox || e.target === btnEditar || e.target === inputNombre) return;
            marcar(!checkbox.checked);
        });

        // --- Edición del nombre ---
        let editando = false;
        // Nombre que tenía el elemento al empezar a editar; se restaura si el campo se deja vacío.
        let nombreAnterior = entry.nombre;

        /** Cambia el texto por el campo de entrada y lo deja enfocado y seleccionado. */
        function iniciarEdicion() {
            editando = true;
            nombreAnterior = entry.nombre;
            textoNombre.style.display = 'none';
            inputNombre.style.display = '';
            inputNombre.focus();
            inputNombre.select();
            btnEditar.classList.add('editando');
        }

        /**
         * Cierra la edición. Si el campo quedó vacío, restaura el nombre que tenía al empezar a editar
         * (nombreAnterior): un elemento nunca se guarda con nombre vacío.
         */
        function terminarEdicion() {
            editando = false;
            const nuevoNombre = inputNombre.value.trim();
            if (nuevoNombre) {
                entry.nombre = nuevoNombre;
                textoNombre.textContent = nuevoNombre;
            } else {
                entry.nombre = nombreAnterior;
                inputNombre.value = nombreAnterior;
                textoNombre.textContent = nombreAnterior;
            }
            textoNombre.style.display = '';
            inputNombre.style.display = 'none';
            btnEditar.classList.remove('editando');
        }

        // Actualiza el estado mientras se escribe, para que Guardar sin salir
        // del campo ya tome el nombre nuevo.
        // Un campo vacío no se copia (así Guardar nunca toma un nombre vacío mientras se edita).
        inputNombre.addEventListener('input', () => {
            if (!inputNombre.value.trim()) return;
            entry.nombre = inputNombre.value;
            textoNombre.textContent = inputNombre.value;
        });
        inputNombre.addEventListener('keydown', e => { if (e.key === 'Enter') terminarEdicion(); });
        inputNombre.addEventListener('blur', terminarEdicion);
        btnEditar.addEventListener('click', e => {
            // stopPropagation: evita que el clic llegue a la tarjeta y cambie la selección.
            e.stopPropagation();
            if (editando) terminarEdicion(); else iniciarEdicion();
        });

        card.append(checkbox, textoNombre, inputNombre, btnEditar);
        entry.cardEl = card;
        entry.inputEl = inputNombre;
        return card;
    }

    /**
     * Pinta los grupos de tarjetas según los módulos activos y la selección guardada.
     * Reinicia `tarjetas`, por lo que siempre parte de lo guardado en `data`.
     */
    function renderizarElementos() {
        const container = document.getElementById('elementosContainer');
        const sinElementosMsg = document.getElementById('sinElementosMsg');
        container.innerHTML = '';
        tarjetas = [];

        const modulos = data.modulosSeleccionados || {};
        // Índice de la selección guardada: clave "<tipo>_<idx>" -> nombre guardado
        // (puede ser un nombre renombrado por el usuario).
        const seleccionPrevia = {};
        (data.elementosAEvaluar || []).forEach(e => {
            seleccionPrevia[`${e.tipo}_${e.idx}`] = e.nombre; // guardado = seleccionado
        });

        let hayAlgunElemento = false;

        FUENTES.forEach(fuente => {
            // Módulo desactivado: su grupo no se muestra.
            if (!modulos[fuente.moduloRequerido]) return;
            const elementos = fuente.obtenerElementos();
            if (elementos.length === 0) return;
            hayAlgunElemento = true;

            const grupoEl = document.createElement('div');
            grupoEl.className = 'grupo-modulo';

            const titulo = document.createElement('div');
            titulo.className = 'grupo-modulo-titulo';
            titulo.textContent = t(fuente.labelKey);
            grupoEl.appendChild(titulo);

            elementos.forEach(elem => {
                const clave = `${elem.tipo}_${elem.idx}`;
                const estaSeleccionado = clave in seleccionPrevia;
                const entry = {
                    tipo: elem.tipo,
                    idx: elem.idx,
                    // Si ya estaba seleccionado se conserva el nombre editado; si ese
                    // nombre guardado es vacío se vuelve al nombre original.
                    nombre: estaSeleccionado ? (seleccionPrevia[clave] || elem.nombre) : elem.nombre,
                    checked: estaSeleccionado,
                    cardEl: null,
                    inputEl: null
                };
                grupoEl.appendChild(crearTarjeta(entry));
                tarjetas.push(entry);
            });

            container.appendChild(grupoEl);
        });

        sinElementosMsg.style.display = hayAlgunElemento ? 'none' : '';
    }

    /**
     * Guarda la selección: solo las tarjetas marcadas pasan a elementosAEvaluar
     * (se descartan cardEl/inputEl y otros campos de UI). Se usa en Guardar y Continuar.
     */
    function saveData() {
        data.elementosAEvaluar = tarjetas
            .filter(e => e.checked)
            .map(e => ({ tipo: e.tipo, idx: e.idx, nombre: e.nombre }));
        PFM.storage.save(data);
    }

    document.addEventListener('DOMContentLoaded', function () {
        PFM.page.init({
            // Nombre del archivo: lo usa PFM.flow para calcular siguiente/anterior.
            page: 'seleccionEvaluar.html',
            save: saveData,
            onLanguageChange: renderizarElementos
        });
        renderizarElementos();
    });
})();
