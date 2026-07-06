// =============================================
// VARIABLES GLOBALES
// =============================================
const data = JSON.parse(localStorage.getItem('projectData') || '{}');
let pdfBlob = null;
let filename = '';
let langTranslations = null;
let currentLang = localStorage.getItem('preferredLanguage') || 'es';

// =============================================
// CONSTANTES DE CONFIGURACIÓN
// =============================================
const NUM_CRITERIOS = 5;
const NUM_CONCEPTOS_MAX = 5;
const NUM_CONCEPTOS_FORMADOS = 3;
const NUM_OPCIONES_POR_CONCEPTO = 3;

// =============================================
// FUNCIONES AUXILIARES ADAPTATIVAS
// =============================================

function obtenerConceptosExistentes() {
    const conceptos = [];
    for (let conc = 1; conc <= NUM_CONCEPTOS_MAX; conc++) {
        const concepto = data[`concepto${conc}`] || '';
        if (concepto.trim() !== '') {
            conceptos.push(conc);
        }
    }
    return conceptos;
}

function generarGruposDinamicos() {
    const conceptosExistentes = obtenerConceptosExistentes();
    const grupos = { col1: [], col2: [], col3: [] };
    
    conceptosExistentes.forEach(conc => {
        const baseGrupo = (conc - 1) * NUM_OPCIONES_POR_CONCEPTO;
        const nombreConcepto = data[`concepto${conc}`] || `${t('idea')} ${conc}`;
        
        grupos.col1.push({
            numero: baseGrupo + 1,
            nombreConcepto: nombreConcepto,
            seleccion: data[`pastel_grupo${baseGrupo + 1}`] || null
        });
        grupos.col2.push({
            numero: baseGrupo + 2,
            nombreConcepto: nombreConcepto,
            seleccion: data[`pastel_grupo${baseGrupo + 2}`] || null
        });
        grupos.col3.push({
            numero: baseGrupo + 3,
            nombreConcepto: nombreConcepto,
            seleccion: data[`pastel_grupo${baseGrupo + 3}`] || null
        });
    });
    
    return grupos;
}

// =============================================
// FUNCIONES DE VERIFICACIÓN DE MÓDULOS
// =============================================
// Antes, estas funciones inferían si una sección debía imprimirse
// revisando si había datos guardados. Ahora consultan directamente
// la selección explícita de módulos hecha en descripcion.html
// (data.modulosSeleccionados), que es una señal más confiable:
// una sección puede estar vacía pero seguir "activa" (p. ej. el
// usuario marcó un módulo y no llegó a llenarlo), y antes eso la
// hacía desaparecer del informe sin que el usuario lo pidiera.

function getModulos() {
    return data.modulosSeleccionados || { analisisInicial: true, definicionIdeas: false };
}

function tieneConceptosIniciales() {
    return getModulos().definicionIdeas === true;
}

function tieneEvaluacionInicial() {
    return getModulos().definicionIdeas === true;
}

function tieneExploracionOpciones() {
    return getModulos().exploracionConceptos === true;
}

function tieneSeleccionesFormacion() {
    return getModulos().exploracionConceptos === true;
}

function tieneEvaluacionConceptosFormados() {
    return getModulos().exploracionConceptos === true;
}

function tienePrevencion() {
    return getModulos().prevencion === true;
}

function tieneTareas() {
    return getModulos().diagrama === true;
}

function tieneMejorConcepto() {
    return getModulos().exploracionConceptos === true;
}

// =============================================
// CARGAR lang.js DINÁMICAMENTE
// =============================================
function loadLangJS() {
    return new Promise((resolve) => {
        if (typeof window.translate !== 'undefined') {
            console.log("lang.js ya está cargado");
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'lang.js';
        script.onload = () => {
            console.log("lang.js cargado dinámicamente");
            langTranslations = window.translations;
            resolve();
        };
        script.onerror = () => {
            console.warn("No se pudo cargar lang.js, usando traducciones locales");
            resolve();
        };
        document.head.appendChild(script);
    });
}

function t(key) {
    if (window.translate) {
        try {
            return window.translate(key);
        } catch (e) {
            console.warn(`No se pudo traducir "${key}" con lang.js:`, e);
        }
    }
    
    const translations = {
        'es': {
            'unnamed_project': '(Sin nombre)',
            'complete_project_report': 'INFORME COMPLETO DE PROYECTO',
            'generated_on': 'Generado el:',
            'project_information': 'INFORMACIÓN DEL PROYECTO',
            'project_name_label': 'Nombre del proyecto:',
            'description_label': 'Descripción:',
            'no_description': '(Sin descripción)',
            'criteria_weights': 'CRITERIOS Y PESOS',
            'criteria': 'Criterio',
            'weight': 'Peso',
            'total_sum_weights': 'SUMA TOTAL DE PESOS:',
            'ideas_concepts': 'IDEAS / CONCEPTOS INICIALES',
            'idea': 'Idea',
            'initial_evaluation': 'EVALUACIÓN INICIAL DE IDEAS',
            'for': 'Para',
            'option': 'Opción',
            'options': 'Opción',
            'explore_possibilities': 'EXPLORACIÓN DE OPCIONES',
            'concept_formation': 'FORMACIÓN DE CONCEPTOS',
            'checkbox_selections': '(Selecciones realizadas con checkboxes)',
            'selection_summary': 'Resumen de selecciones por grupo:',
            'group': 'Grupo',
            'from': 'de',
            'concepts_formed': 'CONCEPTOS FORMADOS',
            'concepts_from_selections': '(Los 3 conceptos creados a partir de las selecciones)',
            'concept_formed': 'Concepto Formado',
            'no_selection': '(Sin selección)',
            'evaluation_concepts_formed': 'EVALUACIÓN DE CONCEPTOS FORMADOS',
            'final_score': 'Puntuación final',
            'best_concept_selected': 'MEJOR CONCEPTO SELECCIONADO',
            'score_obtained': 'Puntuación obtenida',
            'composition_winner': 'COMPOSICIÓN DEL CONCEPTO GANADOR:',
            'idea_not_selected': '(Idea no seleccionada)',
            'no_best_concept_yet': '(Aún no se ha calculado ninguna puntuación de conceptos)',
            'risk_prevention': 'PREVENCIÓN DE RIESGOS',
            'prevention': 'PREVENCIÓN',
            'potential_failure': '• Falla potencial:',
            'effect': '• Efecto:',
            'severity': '• Severidad (1-10):',
            'occurrence': '• Ocurrencia (1-10):',
            'risk': '• Riesgo calculado:',
            'actions_to_take': '• Acción/Acciones a realizar:',
            'responsible': '• Responsable:',
            'today_date': '• Fecha de hoy:',
            'action_taken': '• Acción tomada:',
            'action_date': '• Fecha de realización:',
            'action_plan': 'PLAN DE ACCIÓN',
            'tasks_1_15': 'Tareas 1-15:',
            'tasks_16_30': 'Tareas 16-30:',
            'document_generated': 'Documento generado el',
            'theme_light': 'Cambiar a modo claro',
            'theme_dark': 'Cambiar a modo oscuro'
        },
        'en': {
            'unnamed_project': '(Unnamed)',
            'complete_project_report': 'COMPLETE PROJECT REPORT',
            'generated_on': 'Generated on:',
            'project_information': 'PROJECT INFORMATION',
            'project_name_label': 'Project name:',
            'description_label': 'Description:',
            'no_description': '(No description)',
            'criteria_weights': 'CRITERIA AND WEIGHTS',
            'criteria': 'Criteria',
            'weight': 'Weight',
            'total_sum_weights': 'TOTAL SUM OF WEIGHTS:',
            'ideas_concepts': 'INITIAL IDEAS / CONCEPTS',
            'idea': 'Idea',
            'initial_evaluation': 'INITIAL EVALUATION OF IDEAS',
            'for': 'For',
            'option': 'Option',
            'options': 'Option',
            'explore_possibilities': 'EXPLORATION OF OPTIONS',
            'concept_formation': 'CONCEPT FORMATION',
            'checkbox_selections': '(Selections made with checkboxes)',
            'selection_summary': 'Selection summary by group:',
            'group': 'Group',
            'from': 'from',
            'concepts_formed': 'FORMED CONCEPTS',
            'concepts_from_selections': '(The 3 concepts created from the selections)',
            'concept_formed': 'Concept Formed',
            'no_selection': '(No selection)',
            'evaluation_concepts_formed': 'EVALUATION OF FORMED CONCEPTS',
            'final_score': 'Final score',
            'best_concept_selected': 'BEST CONCEPT SELECTED',
            'score_obtained': 'Score obtained',
            'composition_winner': 'COMPOSITION OF THE WINNING CONCEPT:',
            'idea_not_selected': '(Idea not selected)',
            'no_best_concept_yet': '(No concept score has been calculated yet)',
            'risk_prevention': 'RISK PREVENTION',
            'prevention': 'PREVENTION',
            'potential_failure': '• Potential failure:',
            'effect': '• Effect:',
            'severity': '• Severity (1-10):',
            'occurrence': '• Occurrence (1-10):',
            'risk': '• Calculated risk:',
            'actions_to_take': '• Action/Actions to take:',
            'responsible': '• Responsible:',
            'today_date': '• Today\'s date:',
            'action_taken': '• Action taken:',
            'action_date': '• Date of execution:',
            'action_plan': 'ACTION PLAN',
            'tasks_1_15': 'Tasks 1-15:',
            'tasks_16_30': 'Tasks 16-30:',
            'document_generated': 'Document generated on',
            'theme_light': 'Switch to light mode',
            'theme_dark': 'Switch to dark mode'
        }
    };
    
    return translations[currentLang]?.[key] || key;
}

function tInterface(key) {
    const interfaceTranslations = {
        'es': {
            'app_title': 'Desarrollo de Formularios para Actividades de Mejora',
            'project': 'Proyecto:',
            'report_generated': '¡Informe generado con éxito!',
            'pdf_download_info': 'El informe PDF de su proyecto ha sido generado y descargado automáticamente.<br>Puede encontrarlo en la carpeta de descargas de su navegador.',
            'pdf_filename': 'Nombre del archivo:',
            'download_pdf': '📄 Descargar PDF nuevamente',
            'return_main_menu': '🏠 Volver al menú principal',
            'theme_light': 'Cambiar a modo claro',
            'theme_dark': 'Cambiar a modo oscuro'
        },
        'en': {
            'app_title': 'Development of Forms for Improvement Activities',
            'project': 'Project:',
            'report_generated': 'Report generated successfully!',
            'pdf_download_info': 'Your project PDF report has been generated and downloaded automatically.<br>You can find it in your browser\'s downloads folder.',
            'pdf_filename': 'File name:',
            'download_pdf': '📄 Download PDF again',
            'return_main_menu': '🏠 Return to main menu',
            'theme_light': 'Switch to light mode',
            'theme_dark': 'Switch to dark mode'
        }
    };
    
    return interfaceTranslations[currentLang]?.[key] || key;
}

function updateInterface() {
    const elements = {
        'appTitleText': tInterface('app_title'),
        'projectLabel': tInterface('project'),
        'reportTitle': tInterface('report_generated'),
        'pdfDownloadInfo': tInterface('pdf_download_info'),
        'filenameLabel': tInterface('pdf_filename'),
        'downloadAgainBtn': tInterface('download_pdf'),
        'returnMainMenuBtn': tInterface('return_main_menu')
    };
    
    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (id === 'pdfDownloadInfo') {
                element.innerHTML = elements[id];
            } else {
                element.textContent = elements[id];
            }
        }
    });
    
    document.title = 'Resultados - ' + (currentLang === 'es' ? 'Actividades de Mejora' : 'Improvement Activities');
    updateProjectName();
    updateThemeButton();
}

function updateProjectName() {
    const projectText = document.getElementById('projectNameText');
    if (projectText) {
        if (data.projectName && data.projectName.trim()) {
            projectText.textContent = data.projectName;
        } else {
            projectText.textContent = currentLang === 'es' ? '(Sin nombre)' : '(Unnamed)';
        }
    }
}

function updateThemeButton() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    
    if (currentTheme === 'dark') {
        themeToggle.textContent = '☀️';
        themeToggle.title = tInterface('theme_light');
    } else {
        themeToggle.textContent = '🌙';
        themeToggle.title = tInterface('theme_dark');
    }
}

// =============================================
// FUNCIÓN PRINCIPAL GENERAR PDF
// =============================================
function generarPDF() {
    if (typeof window.jspdf === 'undefined') {
        console.error('Error: jsPDF no está cargado.');
        alert('Error: No se puede generar el PDF. jsPDF no está cargado.');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    let y = 20;
    let seccionActual = 0;
    const margen = 20;
    const anchoPagina = doc.internal.pageSize.width;
    const isSpanish = currentLang === 'es';

    /**
     * Imprime el título de una sección con numeración secuencial.
     * El número solo avanza cuando una sección realmente se imprime,
     * así que la numeración siempre queda consecutiva (1, 2, 3...)
     * sin huecos, sin importar qué módulos estén activos.
     */
    function imprimirTituloSeccion(textoBase) {
        seccionActual++;
        doc.setFontSize(16);
        doc.setTextColor(21, 101, 192);
        doc.setFont("helvetica", "bold");
        doc.text(`${seccionActual}. ${textoBase}`, margen, y);
        y += 15;
    }

    // ==================== PORTADA (SIEMPRE) ====================
    doc.setFontSize(24);
    doc.setTextColor(21, 101, 192);
    doc.setFont("helvetica", "bold");
    doc.text(t('complete_project_report'), anchoPagina / 2, 80, { align: "center" });

    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.text(data.projectName || (isSpanish ? "Proyecto sin nombre" : "Unnamed project"), anchoPagina / 2, 110, { align: "center" });

    const hoy = new Date().toLocaleDateString(isSpanish ? 'es-ES' : 'en-US');
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text(`${t('generated_on')} ${hoy}`, anchoPagina / 2, 130, { align: "center" });

    // ==================== INFORMACIÓN DEL PROYECTO (SIEMPRE) ====================
    doc.addPage();
    y = margen;

    imprimirTituloSeccion(t('project_information'));

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    
    doc.setFont("helvetica", "bold");
    doc.text(t('project_name_label'), margen, y);
    doc.setFont("helvetica", "normal");
    doc.text(data.projectName || t('unnamed_project'), margen + 50, y);
    y += 10;

    if (data.projectDescription && data.projectDescription.trim()) {
        doc.setFont("helvetica", "bold");
        doc.text(t('description_label'), margen, y);
        doc.setFont("helvetica", "normal");
        y += 8;
        
        const descripcionLines = doc.splitTextToSize(data.projectDescription, anchoPagina - 2 * margen);
        for (let i = 0; i < descripcionLines.length; i++) {
            if (y > 280) { doc.addPage(); y = margen; }
            doc.text(descripcionLines[i], margen, y);
            y += 7;
        }
    } else {
        doc.setFont("helvetica", "bold");
        doc.text(t('description_label'), margen, y);
        doc.setFont("helvetica", "normal");
        doc.text(t('no_description'), margen + 50, y);
        y += 10;
    }
    y += 15;

    // ==================== CRITERIOS Y PESOS (SIEMPRE) ====================
    imprimirTituloSeccion(t('criteria_weights'));

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");

    let sumaPesos = 0;
    for (let i = 1; i <= NUM_CRITERIOS; i++) {
        const criterio = data[`criterio${i}`] || `${t('criteria')} ${i}`;
        const peso = parseFloat(data[`peso${i}`]) || 0;
        sumaPesos += peso;

        doc.text(`${i}. ${criterio}`, margen, y);
        doc.text(`${t('weight')}: ${peso.toFixed(1)}`, margen + 100, y);
        y += 10;
        if (y > 280) { doc.addPage(); y = margen; }
    }

    doc.setFont("helvetica", "bold");
    doc.text(`${t('total_sum_weights')} ${sumaPesos.toFixed(1)}`, margen, y);
    y += 15;
    doc.setFont("helvetica", "normal");
    y += 10;

    // ==================== IDEAS / CONCEPTOS INICIALES (SOLO SI HAY) ====================
    if (tieneConceptosIniciales()) {
        if (y > 250) { doc.addPage(); y = margen; }
        
        imprimirTituloSeccion(t('ideas_concepts'));

        const elementosEval = data.elementosAEvaluar || [];
        elementosEval.forEach((elem, index) => {
            doc.text(`${index + 1}. [${elem.tipo}] ${elem.nombre}`, margen, y);
            y += 10;
            if (y > 280) { doc.addPage(); y = margen; }
        });
        y += 10;
    }

    // ==================== EVALUACIÓN INICIAL DE IDEAS (SOLO SI HAY) ====================
    if (tieneEvaluacionInicial()) {
        if (y > 220) { doc.addPage(); y = margen; }

        imprimirTituloSeccion(t('initial_evaluation'));

        const elementosEval = data.elementosAEvaluar || [];
        elementosEval.forEach(elem => {
            if (y > 240) { doc.addPage(); y = margen; }

            const claveRes = `eval_resultado_${elem.tipo}_${elem.idx}`;
            let tieneDatos = false;
            for (let i = 1; i <= NUM_CRITERIOS; i++) {
                const clave = `eval_${elem.tipo}_${elem.idx}_crit${i}`;
                if (data[clave] && data[clave] !== '') {
                    const num = parseFloat(data[clave]);
                    if (!isNaN(num) && num > 0) { tieneDatos = true; break; }
                }
            }
            if (!tieneDatos) return;

            doc.setFontSize(14);
            doc.setTextColor(13, 71, 161);
            doc.setFont("helvetica", "bold");
            doc.text(`${elem.nombre}`, margen, y);
            y += 12;

            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "normal");

            let total = 0;
            for (let i = 1; i <= NUM_CRITERIOS; i++) {
                const clave = `eval_${elem.tipo}_${elem.idx}_crit${i}`;
                const califVal = data[clave];
                if (califVal && califVal !== '') {
                    const calif = parseFloat(califVal) || 0;
                    const peso = parseFloat(data[`peso${i}`]) || 0;
                    const ponderado = calif * peso;
                    total += ponderado;
                    const criterio = data[`criterio${i}`] || `${t('criteria')} ${i}`;
                    doc.text(`  ${criterio}: ${calif.toFixed(1)} × ${peso.toFixed(1)} = ${ponderado.toFixed(2)}`, margen + 10, y);
                    y += 8;
                    if (y > 280) { doc.addPage(); y = margen; }
                }
            }
            doc.setFont("helvetica", "bold");
            doc.text(`  TOTAL: ${total.toFixed(2)}`, margen + 10, y);
            doc.setFont("helvetica", "normal");
            y += 22;
        });
        y += 10;
    }

    // ==================== PLAN DE ACCIÓN (SOLO SI HAY) ====================
    if (tieneTareas()) {
        if (y > 230) { doc.addPage(); y = margen; }
        
        imprimirTituloSeccion(t('action_plan'));

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);

        // Espacio entre columnas = 32 caracteres × ~2mm/carácter = 64 unidades
        const espacioCol = 32 * 2; // 64 unidades
        const col1 = margen;           // Número:   posición 20
        const col2 = col1 + 10;        // Persona:  posición 30  (número ocupa ~10)
        const col3 = col2 + espacioCol; // Tarea:    posición 94  (32 chars desde persona)
        const col4 = col3 + espacioCol; // Salida:   posición 158 (32 chars desde tarea)

        let filaNum = 1;

        for (let i = 1; i <= 30; i++) {
            const persona = data[`persona${i}`] || "";
            const tarea   = data[`tarea${i}`]   || "";
            const salida  = data[`salida${i}`]  || "";

            if (persona.trim() || tarea.trim() || salida.trim()) {
                if (y > 270) { doc.addPage(); y = margen; }

                doc.text(`${filaNum}.`, col1, y);
                doc.text(persona, col2, y);
                doc.text(tarea,   col3, y);
                doc.text(salida,  col4, y);

                y += 8;
                filaNum++;
            }
        }

        y += 10;
    }

    // ==================== EXPLORACIÓN DE OPCIONES (SOLO SI HAY) ====================
    if (tieneExploracionOpciones()) {
        if (y > 200) { doc.addPage(); y = margen; }
        
        imprimirTituloSeccion(t('explore_possibilities'));

        const conceptosExistentes = obtenerConceptosExistentes();
        conceptosExistentes.forEach(conc => {
            if (y > 250) { doc.addPage(); y = margen; }
            
            doc.setFontSize(14);
            doc.setTextColor(13, 71, 161);
            doc.setFont("helvetica", "bold");
            const conceptoNombre = data[`concepto${conc}`] || `${t('idea')} ${conc}`;
            doc.text(`${t('for')} ${conceptoNombre}`, margen, y);
            y += 12;

            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "normal");

            for (let row = 1; row <= NUM_OPCIONES_POR_CONCEPTO; row++) {
                const posIdx = (conc - 1) * NUM_OPCIONES_POR_CONCEPTO + row;
                const posibilidad = data[`pos${posIdx}`] || "";
                if (posibilidad && posibilidad.trim()) {
                    doc.text(`  ${t('options')} ${row}: ${posibilidad}`, margen + 10, y);
                    y += 8;
                    if (y > 280) { doc.addPage(); y = margen; }
                }
            }
            y += 10;
        });
        y += 10;
    }

    // ==================== FORMACIÓN DE CONCEPTOS (SOLO SI HAY) ====================
    if (tieneSeleccionesFormacion()) {
        if (y > 200) { doc.addPage(); y = margen; }
        
        imprimirTituloSeccion(t('concept_formation'));

        doc.setFontSize(12);
        doc.setTextColor(80, 80, 80);
        doc.text(t('checkbox_selections'), margen, y);
        y += 10;

        const grupos = generarGruposDinamicos();
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(t('selection_summary'), margen, y);
        y += 10;

        for (let col = 1; col <= NUM_CONCEPTOS_FORMADOS; col++) {
            const gruposCol = col === 1 ? grupos.col1 : col === 2 ? grupos.col2 : grupos.col3;
            const tieneSeleccionesCol = gruposCol.some(g => g.seleccion && g.seleccion.trim());
            if (tieneSeleccionesCol) {
                doc.setFont("helvetica", "bold");
                doc.text(`  ${t('concept_formed')} ${col}:`, margen + 10, y);
                y += 8;
                doc.setFont("helvetica", "normal");
                gruposCol.forEach(grupo => {
                    if (grupo.seleccion && grupo.seleccion.trim()) {
                        doc.text(`    ${grupo.nombreConcepto}: ${grupo.seleccion}`, margen + 20, y);
                        y += 8;
                        if (y > 280) { doc.addPage(); y = margen; }
                    }
                });
                y += 5;
            }
        }
        y += 15;
    }

    // ==================== CONCEPTOS FORMADOS (SOLO SI HAY) ====================
    if (tieneSeleccionesFormacion()) {
        if (y > 220) { doc.addPage(); y = margen; }
        
        imprimirTituloSeccion(t('concepts_formed'));

        doc.setFontSize(12);
        doc.setTextColor(80, 80, 80);
        doc.text(t('concepts_from_selections'), margen, y);
        y += 10;

        const grupos = generarGruposDinamicos();
        const conceptosFormados = [
            { nombre: t('concept_formed') + " 1", grupos: grupos.col1 },
            { nombre: t('concept_formed') + " 2", grupos: grupos.col2 },
            { nombre: t('concept_formed') + " 3", grupos: grupos.col3 }
        ];

        conceptosFormados.forEach(concepto => {
            const tieneSelecciones = concepto.grupos.some(g => g.seleccion && g.seleccion.trim());
            if (!tieneSelecciones) return;
            
            if (y > 240) { doc.addPage(); y = margen; }

            doc.setFontSize(14);
            doc.setTextColor(13, 71, 161);
            doc.setFont("helvetica", "bold");
            doc.text(concepto.nombre, margen, y);
            y += 12;

            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "normal");

            concepto.grupos.forEach((grupo, index) => {
                const texto = (grupo.seleccion && grupo.seleccion.trim()) 
                    ? `${index + 1}. ${grupo.nombreConcepto}: ${grupo.seleccion}`
                    : `${index + 1}. ${grupo.nombreConcepto}: ${t('no_selection')}`;
                doc.text(texto, margen + 10, y);
                y += 10;
                if (y > 280) { doc.addPage(); y = margen; }
            });
            y += 10;
        });
        y += 15;
    }

    // ==================== EVALUACIÓN DE CONCEPTOS FORMADOS (SOLO SI HAY) ====================
    if (tieneEvaluacionConceptosFormados()) {
        if (y > 220) { doc.addPage(); y = margen; }
        
        imprimirTituloSeccion(t('evaluation_concepts_formed'));

        for (let conc = 1; conc <= NUM_CONCEPTOS_FORMADOS; conc++) {
            let tieneDatos = false;
            let total = 0;
            for (let i = 1; i <= NUM_CRITERIOS; i++) {
                const key = `ca${(conc - 1) * NUM_CRITERIOS + i}`;
                const califVal = data[key];
                if (califVal && califVal !== '') {
                    const calif = parseFloat(califVal) || 0;
                    if (calif > 0) { tieneDatos = true; }
                    const peso = parseFloat(data[`peso${i}`]) || 0;
                    total += calif * peso;
                }
            }
            if (!tieneDatos) continue;
            
            if (y > 260) { doc.addPage(); y = margen; }

            doc.setFontSize(14);
            doc.setTextColor(13, 71, 161);
            doc.setFont("helvetica", "bold");
            doc.text(`${t('concept_formed')} ${conc}`, margen, y);
            y += 12;

            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "normal");

            doc.text(`${t('final_score')}: ${total.toFixed(2)}`, margen + 10, y);
            y += 12;
            data[`resultado${conc + 3}`] = total.toFixed(2);
        }
        y += 15;
    }

    // ==================== MEJOR CONCEPTO SELECCIONADO (SOLO SI HAY) ====================
    if (tieneMejorConcepto()) {
        if (y > 230) { doc.addPage(); y = margen; }
        
        imprimirTituloSeccion(t('best_concept_selected'));

        let mejorIndice = -1;
        let mejorPuntuacion = -1;
        for (let i = 4; i <= 6; i++) {
            const puntuacion = parseFloat(data[`resultado${i}`]) || 0;
            if (puntuacion > mejorPuntuacion) {
                mejorPuntuacion = puntuacion;
                mejorIndice = i - 3;
            }
        }

        if (mejorIndice > 0 && mejorPuntuacion > 0) {
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "normal");
            doc.text(`${t('score_obtained')}: ${mejorPuntuacion.toFixed(2)}`, margen, y);
            y += 12;

            doc.setFontSize(14);
            doc.setTextColor(21, 101, 192);
            doc.setFont("helvetica", "bold");
            doc.text(t('composition_winner'), margen, y);
            y += 12;

            const grupos = generarGruposDinamicos();
            const gruposMejorConcepto = mejorIndice === 1 ? grupos.col1 : mejorIndice === 2 ? grupos.col2 : grupos.col3;

            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "normal");

            gruposMejorConcepto.forEach((grupo, index) => {
                if (y > 270) { doc.addPage(); y = margen; }
                const texto = (grupo.seleccion && grupo.seleccion.trim()) 
                    ? `${index + 1}. ${grupo.nombreConcepto}: ${grupo.seleccion}`
                    : `${index + 1}. ${grupo.nombreConcepto}: ${t('idea_not_selected')}`;
                doc.text(texto, margen + 10, y);
                y += 10;
            });
        } else {
            doc.setFontSize(12);
            doc.setTextColor(100, 100, 100);
            doc.setFont("helvetica", "normal");
            doc.text(t('no_best_concept_yet'), margen, y);
            y += 12;
        }
        y += 20;
    }

    // ==================== PREVENCIÓN DE RIESGOS (SOLO SI HAY) ====================
    if (tienePrevencion()) {
        if (y > 220) { doc.addPage(); y = margen; }
        
        imprimirTituloSeccion(t('risk_prevention'));

        for (let i = 1; i <= 3; i++) {
            let tieneDatos = false;
            
            // Verificar cada campo
            const falla = data[`fallaPotencial${i}`];
            const efecto = data[`efecto${i}`];
            const sev = data[`sev${i}`];
            const ocu = data[`ocu${i}`];
            const riesgo = data[`riesgo${i}`];
            const accionReal = data[`accionReal${i}`];
            const responsable = data[`responsable${i}`];
            const fechaCell = data[`fechaCell${i}`];
            const accionTom = data[`accionTom${i}`];
            const fecha = data[`fecha${i}`];
            
            if ((falla && falla.trim()) || (efecto && efecto.trim()) || 
                (sev && sev.toString().trim() && parseFloat(sev) > 0) ||
                (ocu && ocu.toString().trim() && parseFloat(ocu) > 0) ||
                (riesgo && riesgo.toString().trim() && parseFloat(riesgo) > 0) ||
                (accionReal && accionReal.trim()) || (responsable && responsable.trim()) ||
                (fechaCell && fechaCell.trim()) || (accionTom && accionTom.trim()) ||
                (fecha && fecha.trim())) {
                tieneDatos = true;
            }
            
            if (!tieneDatos) continue;
            
            if (y > 240) { doc.addPage(); y = margen; }

            doc.setFontSize(14);
            doc.setTextColor(13, 71, 161);
            doc.setFont("helvetica", "bold");
            doc.text(`${t('prevention')} ${i}`, margen, y);
            y += 12;

            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "normal");

            if (falla && falla.trim()) { doc.text(`${t('potential_failure')} ${falla}`, margen + 10, y); y += 10; }
            if (efecto && efecto.trim()) { doc.text(`${t('effect')} ${efecto}`, margen + 10, y); y += 10; }
            if (sev && sev.toString().trim() && parseFloat(sev) > 0) { doc.text(`${t('severity')} ${sev}`, margen + 10, y); y += 10; }
            if (ocu && ocu.toString().trim() && parseFloat(ocu) > 0) { doc.text(`${t('occurrence')} ${ocu}`, margen + 10, y); y += 10; }
            if (riesgo && riesgo.toString().trim() && parseFloat(riesgo) > 0) { doc.text(`${t('risk')} ${riesgo}`, margen + 10, y); y += 10; }
            if (accionReal && accionReal.trim()) { doc.text(`${t('actions_to_take')} ${accionReal}`, margen + 10, y); y += 10; }
            if (responsable && responsable.trim()) { doc.text(`${t('responsible')} ${responsable}`, margen + 10, y); y += 10; }
            if (fechaCell && fechaCell.trim()) { doc.text(`${t('today_date')} ${fechaCell}`, margen + 10, y); y += 10; }
            if (accionTom && accionTom.trim()) { doc.text(`${t('action_taken')} ${accionTom}`, margen + 10, y); y += 10; }
            if (fecha && fecha.trim()) { doc.text(`${t('action_date')} ${fecha}`, margen + 10, y); y += 10; }

            y += 10;
            if (y > 280) { doc.addPage(); y = margen; }
        }
        y += 15;
    }

    // ==================== FIN DEL DOCUMENTO (SIEMPRE) ====================
    const finalY = doc.internal.pageSize.height - 20;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`${t('document_generated')} ${hoy}`, anchoPagina / 2, finalY, { align: "center" });

    // Guardar PDF
    pdfBlob = doc.output('blob');
    filename = `informe_${(data.projectName || 'proyecto').replace(/ /g, '_')}.pdf`;
    
    const filenameDisplay = document.getElementById('filenameDisplay');
    if (filenameDisplay) {
        filenameDisplay.textContent = filename;
    }

    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// =============================================
// CONFIGURACIÓN INICIAL
// =============================================
async function initialize() {
    console.log("Inicializando página de resultados...");
    
    await loadLangJS();
    currentLang = localStorage.getItem('preferredLanguage') || 'es';
    updateInterface();
    
    const langSelector = document.getElementById('languageSelector');
    if (langSelector) {
        langSelector.value = currentLang;
        langSelector.addEventListener('change', function() {
            currentLang = this.value;
            localStorage.setItem('preferredLanguage', currentLang);
            updateInterface();
            if (typeof window.setAppLanguage === 'function') {
                window.setAppLanguage(currentLang);
            }
        });
    }
    
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButton();
    
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const current = document.documentElement.getAttribute('data-theme');
            const newTheme = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeButton();
        });
    }
    
    const downloadAgainBtn = document.getElementById('downloadAgainBtn');
    if (downloadAgainBtn) {
        downloadAgainBtn.addEventListener('click', function() {
            if (pdfBlob) {
                const url = URL.createObjectURL(pdfBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else {
                generarPDF();
            }
        });
    }
    
    const filenameDisplay = document.getElementById('filenameDisplay');
    if (filenameDisplay) {
        filename = `informe_${(data.projectName || 'proyecto').replace(/ /g, '_')}.pdf`;
        filenameDisplay.textContent = filename;
    }
    
    setTimeout(function() {
        console.log("Generando PDF automáticamente...");
        generarPDF();
    }, 1000);
}

document.addEventListener('DOMContentLoaded', function() {
    initialize().catch(error => {
        console.error("Error en inicialización:", error);
    });
});

window.addEventListener('error', function(event) {
    console.error('Error global capturado:', event.error);
});

window.generarPDF = generarPDF;
window.obtenerConceptosExistentes = obtenerConceptosExistentes;
window.generarGruposDinamicos = generarGruposDinamicos;