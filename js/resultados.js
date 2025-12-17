// =============================================
// VARIABLES GLOBALES
// =============================================
const data = JSON.parse(localStorage.getItem('projectData') || '{}');
let pdfBlob = null;
let filename = '';
let langTranslations = null;
let currentLang = localStorage.getItem('preferredLanguage') || 'es';

// =============================================
// CARGAR lang.js DINÁMICAMENTE
// =============================================
function loadLangJS() {
    return new Promise((resolve, reject) => {
        // Verificar si ya está cargado
        if (typeof window.translate !== 'undefined') {
            console.log("lang.js ya está cargado");
            resolve();
            return;
        }
        
        // Crear script para cargar lang.js
        const script = document.createElement('script');
        script.src = 'lang.js';
        script.onload = () => {
            console.log("lang.js cargado dinámicamente");
            // Acceder a las traducciones del lang.js existente
            langTranslations = window.translations;
            resolve();
        };
        script.onerror = () => {
            console.warn("No se pudo cargar lang.js, usando traducciones locales");
            resolve(); // Continuamos aunque falle
        };
        
        document.head.appendChild(script);
    });
}

// =============================================
// FUNCIÓN DE TRADUCCIÓN MEJORADA
// =============================================
function t(key) {
    // Primero intentamos usar lang.js si está disponible
    if (window.translate) {
        try {
            return window.translate(key);
        } catch (e) {
            console.warn(`No se pudo traducir "${key}" con lang.js:`, e);
        }
    }
    
    // Si lang.js no está disponible, usamos traducciones locales para el PDF
    const translations = {
        'es': {
            'unnamed_project': '(Sin nombre)',
            'complete_project_report': 'INFORME COMPLETO DE PROYECTO',
            'generated_on': 'Generado el:',
            'criteria_weights': '1. CRITERIOS Y PESOS',
            'criteria': 'Criterio',
            'weight': 'Peso',
            'total_sum_weights': 'SUMA TOTAL DE PESOS:',
            'ideas_concepts': '2. IDEAS / CONCEPTOS INICIALES',
            'idea': 'Idea',
            'initial_evaluation': '3. EVALUACIÓN INICIAL DE IDEAS',
            'no_initial_data': 'No hay datos de evaluación inicial',
            'for': 'Para',
            'option': 'Opción',
            'explore_possibilities': '4. EXPLORACIÓN DE POSIBILIDADES',
            'no_possibilities_data': 'No hay datos de exploración de posibilidades',
            'concept_formation': '5. FORMACIÓN DE CONCEPTOS',
            'checkbox_selections': '(Selecciones realizadas con checkboxes)',
            'selection_summary': 'Resumen de selecciones por grupo:',
            'group': 'Grupo',
            'from': 'de',
            'no_selections': 'No hay selecciones realizadas',
            'concepts_formed': '6. CONCEPTOS FORMADOS',
            'concepts_from_selections': '(Los 3 conceptos creados a partir de las selecciones)',
            'concept_formed': 'Concepto Formado',
            'no_selection': '(Sin selección)',
            'no_concepts_formed': 'No se han formado conceptos',
            'evaluation_concepts_formed': '7. EVALUACIÓN DE CONCEPTOS FORMADOS',
            'no_evaluation_concepts': 'No hay evaluación de conceptos formados',
            'final_score': 'Puntuación final:',
            'best_concept_selected': '8. MEJOR CONCEPTO SELECCIONADO',
            'score_obtained': 'Puntuación obtenida:',
            'composition_winner': 'COMPOSICIÓN DEL CONCEPTO GANADOR:',
            'idea_not_selected': '(Idea no seleccionada)',
            'no_best_concept': 'No hay concepto evaluado como mejor',
            'risk_prevention': '9. PREVENCIÓN DE RIESGOS',
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
            'no_prevention_data': 'No hay datos de prevención de riesgos',
            'action_plan': '10. PLAN DE ACCIÓN',
            'tasks_1_15': 'Tareas 1-15:',
            'tasks_16_30': 'Tareas 16-30:',
            'no_tasks': 'No hay tareas en el plan',
            'document_generated': 'Documento generado el',
            'theme_light': 'Cambiar a modo claro',
            'theme_dark': 'Cambiar a modo oscuro'
        },
        'en': {
            'unnamed_project': '(Unnamed)',
            'complete_project_report': 'COMPLETE PROJECT REPORT',
            'generated_on': 'Generated on:',
            'criteria_weights': '1. CRITERIA AND WEIGHTS',
            'criteria': 'Criteria',
            'weight': 'Weight',
            'total_sum_weights': 'TOTAL SUM OF WEIGHTS:',
            'ideas_concepts': '2. INITIAL IDEAS / CONCEPTS',
            'idea': 'Idea',
            'initial_evaluation': '3. INITIAL EVALUATION OF IDEAS',
            'no_initial_data': 'No initial evaluation data',
            'for': 'For',
            'option': 'Option',
            'explore_possibilities': '4. EXPLORATION OF POSSIBILITIES',
            'no_possibilities_data': 'No exploration of possibilities data',
            'concept_formation': '5. CONCEPT FORMATION',
            'checkbox_selections': '(Selections made with checkboxes)',
            'selection_summary': 'Selection summary by group:',
            'group': 'Group',
            'from': 'from',
            'no_selections': 'No selections made',
            'concepts_formed': '6. FORMED CONCEPTS',
            'concepts_from_selections': '(The 3 concepts created from the selections)',
            'concept_formed': 'Concept Formed',
            'no_selection': '(No selection)',
            'no_concepts_formed': 'No concepts have been formed',
            'evaluation_concepts_formed': '7. EVALUATION OF FORMED CONCEPTS',
            'no_evaluation_concepts': 'No evaluation of formed concepts',
            'final_score': 'Final score:',
            'best_concept_selected': '8. BEST CONCEPT SELECTED',
            'score_obtained': 'Score obtained:',
            'composition_winner': 'COMPOSITION OF THE WINNING CONCEPT:',
            'idea_not_selected': '(Idea not selected)',
            'no_best_concept': 'No concept evaluated as best',
            'risk_prevention': '9. RISK PREVENTION',
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
            'no_prevention_data': 'No risk prevention data',
            'action_plan': '10. ACTION PLAN',
            'tasks_1_15': 'Tasks 1-15:',
            'tasks_16_30': 'Tasks 16-30:',
            'no_tasks': 'No tasks in the plan',
            'document_generated': 'Document generated on',
            'theme_light': 'Switch to light mode',
            'theme_dark': 'Switch to dark mode'
        }
    };
    
    return translations[currentLang]?.[key] || key;
}

// =============================================
// TRADUCCIONES PARA LA INTERFAZ DE RESULTADOS
// =============================================
function tInterface(key) {
    // Traducciones específicas para la página de resultados
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

// =============================================
// ACTUALIZAR INTERFAZ DE USUARIO
// =============================================
function updateInterface() {
    // Actualizar textos de la interfaz
    const elements = {
        'appTitleText': tInterface('app_title'),
        'projectLabel': tInterface('project'),
        'reportTitle': tInterface('report_generated'),
        'pdfDownloadInfo': tInterface('pdf_download_info'),
        'filenameLabel': tInterface('pdf_filename'),
        'downloadAgainBtn': tInterface('download_pdf'),
        'returnMainMenuBtn': tInterface('return_main_menu')
    };
    
    // Aplicar traducciones a los elementos
    Object.keys(elements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (id === 'pdfDownloadInfo') {
                element.innerHTML = elements[id]; // Usar innerHTML para <br>
            } else {
                element.textContent = elements[id];
            }
        }
    });
    
    // Actualizar título de la página
    document.title = 'Resultados - ' + (currentLang === 'es' ? 'Actividades de Mejora' : 'Improvement Activities');
    
    // Actualizar nombre del proyecto
    updateProjectName();
    
    // Actualizar botón de tema
    updateThemeButton();
}

// =============================================
// FUNCIONES AUXILIARES
// =============================================

// Actualizar nombre del proyecto en navbar
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

// Actualizar icono del botón de tema
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
    // Verificar si jsPDF está disponible
    if (typeof window.jspdf === 'undefined') {
        console.error('Error: jsPDF no está cargado. Asegúrate de incluir el script en tu HTML.');
        alert('Error: No se puede generar el PDF. jsPDF no está cargado.');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    let y = 20;
    const margen = 20;
    const anchoPagina = doc.internal.pageSize.width;

    // Determinar idioma actual
    const currentLang = localStorage.getItem('preferredLanguage') || 'es';
    const isSpanish = currentLang === 'es';

    // 1. PORTADA
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

    // Nueva página para contenido
    doc.addPage();
    y = margen;

    // 2. CRITERIOS Y PESOS
    doc.setFontSize(16);
    doc.setTextColor(21, 101, 192);
    doc.setFont("helvetica", "bold");
    doc.text(t('criteria_weights'), margen, y);
    y += 15;

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");

    let sumaPesos = 0;
    for (let i = 1; i <= 4; i++) {
        const criterio = data[`criterio${i}`] || `${t('criteria')} ${i}`;
        const peso = parseFloat(data[`peso${i}`]) || 0;
        sumaPesos += peso;

        doc.text(`${i}. ${criterio}`, margen, y);
        doc.text(`${t('weight')}: ${peso.toFixed(1)}`, margen + 100, y);
        y += 10;

        if (y > 280) {
            doc.addPage();
            y = margen;
        }
    }

    doc.setFont("helvetica", "bold");
    doc.text(`${t('total_sum_weights')} ${sumaPesos.toFixed(1)}`, margen, y);
    y += 15;
    doc.setFont("helvetica", "normal");

    y += 10;

    // 3. IDEAS / CONCEPTOS INICIALES
    if (y > 250) {
        doc.addPage();
        y = margen;
    }

    doc.setFontSize(16);
    doc.setTextColor(21, 101, 192);
    doc.setFont("helvetica", "bold");
    doc.text(t('ideas_concepts'), margen, y);
    y += 15;

    for (let i = 1; i <= 5; i++) {
        const concepto = data[`concepto${i}`] || `${t('idea')} ${i}`;
        doc.text(`${i}. ${concepto}`, margen, y);
        y += 10;

        if (y > 280) {
            doc.addPage();
            y = margen;
        }
    }

    y += 10;

    // 4. EVALUACIÓN INICIAL DE IDEAS
    if (y > 220) {
        doc.addPage();
        y = margen;
    }

    doc.setFontSize(16);
    doc.setTextColor(21, 101, 192);
    doc.setFont("helvetica", "bold");
    doc.text(t('initial_evaluation'), margen, y);
    y += 15;

    // Verificar si hay datos de evaluación inicial
    let tieneEvaluacionInicial = false;
    for (let conc = 1; conc <= 5; conc++) {
        for (let i = 1; i <= 4; i++) {
            if (data[`calif${conc}_${i}`]) {
                tieneEvaluacionInicial = true;
                break;
            }
        }
        if (tieneEvaluacionInicial) break;
    }

    if (tieneEvaluacionInicial) {
        for (let conc = 1; conc <= 5; conc++) {
            if (y > 240) {
                doc.addPage();
                y = margen;
            }

            doc.setFontSize(14);
            doc.setTextColor(13, 71, 161);
            doc.setFont("helvetica", "bold");
            doc.text(`${t('idea')} ${conc}: ${data[`concepto${conc}`] || `${t('idea')} ${conc}`}`, margen, y);
            y += 12;

            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "normal");

            let total = 0;
            let tieneDatos = false;

            for (let i = 1; i <= 4; i++) {
                const calif = parseFloat(data[`calif${conc}_${i}`]) || 0;
                const peso = parseFloat(data[`peso${i}`]) || 0;

                if (data[`calif${conc}_${i}`]) {
                    tieneDatos = true;
                    const ponderado = calif * peso;
                    total += ponderado;

                    const criterio = data[`criterio${i}`] || `${t('criteria')} ${i}`;
                    doc.text(`  ${criterio}: ${calif.toFixed(1)} × ${peso.toFixed(1)} = ${ponderado.toFixed(2)}`, margen + 10, y);
                    y += 8;

                    if (y > 280) {
                        doc.addPage();
                        y = margen;
                    }
                }
            }

            if (tieneDatos) {
                doc.setFont("helvetica", "bold");
                doc.text(`  TOTAL: ${total.toFixed(2)}`, margen + 10, y);
                doc.setFont("helvetica", "normal");
                y += 12;
            }

            y += 10;
        }
    } else {
        doc.text(t('no_initial_data'), margen, y);
        y += 10;
    }

    y += 10;

    // 5. EXPLORACIÓN DE POSIBILIDADES
    if (y > 200) {
        doc.addPage();
        y = margen;
    }

    doc.setFontSize(16);
    doc.setTextColor(21, 101, 192);
    doc.setFont("helvetica", "bold");
    doc.text(t('explore_possibilities'), margen, y);
    y += 15;

    // Verificar si hay datos de posibilidades
    let tienePosibilidades = false;
    for (let i = 1; i <= 15; i++) {
        if (data[`pos${i}`]) {
            tienePosibilidades = true;
            break;
        }
    }

    if (tienePosibilidades) {
        for (let conc = 1; conc <= 5; conc++) {
            if (y > 250) {
                doc.addPage();
                y = margen;
            }

            doc.setFontSize(14);
            doc.setTextColor(13, 71, 161);
            doc.setFont("helvetica", "bold");
            doc.text(`${t('for')} ${data[`concepto${conc}`] || `${t('idea')} ${conc}`}`, margen, y);
            y += 12;

            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "normal");

            for (let row = 1; row <= 3; row++) {
                const posIdx = (conc - 1) * 3 + row;
                const posibilidad = data[`pos${posIdx}`] || "";

                if (posibilidad) {
                    doc.text(`  ${t('option')} ${row}: ${posibilidad}`, margen + 10, y);
                    y += 8;

                    if (y > 280) {
                        doc.addPage();
                        y = margen;
                    }
                }
            }

            y += 10;
        }
    } else {
        doc.text(t('no_possibilities_data'), margen, y);
        y += 10;
    }

    y += 10;

    // 6. FORMACIÓN DE CONCEPTOS
    if (y > 200) {
        doc.addPage();
        y = margen;
    }

    doc.setFontSize(16);
    doc.setTextColor(21, 101, 192);
    doc.setFont("helvetica", "bold");
    doc.text(t('concept_formation'), margen, y);
    y += 15;

    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text(t('checkbox_selections'), margen, y);
    y += 10;

    // Verificar si hay selecciones
    let tieneSelecciones = false;
    for (let i = 1; i <= 15; i++) {
        if (data[`pastel_grupo${i}`]) {
            tieneSelecciones = true;
            break;
        }
    }

    if (tieneSelecciones) {
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);

        // Mostrar tabla de selecciones
        doc.text(t('selection_summary'), margen, y);
        y += 10;

        for (let i = 1; i <= 15; i++) {
            const seleccion = data[`pastel_grupo${i}`];
            if (seleccion) {
                // Determinar a qué idea original pertenece
                const ideaOriginal = Math.ceil(i / 3);
                const nombreIdea = data[`concepto${ideaOriginal}`] || `${t('idea')} ${ideaOriginal}`;

                doc.text(`  ${t('group')} ${i} (${t('from')} ${nombreIdea}): ${seleccion}`, margen + 10, y);
                y += 8;

                if (y > 280) {
                    doc.addPage();
                    y = margen;
                }
            }
        }
    } else {
        doc.text(t('no_selections'), margen, y);
        y += 10;
    }

    y += 15;

    // 7. CONCEPTOS FORMADOS (3 conceptos de 5 ideas)
    if (y > 220) {
        doc.addPage();
        y = margen;
    }

    doc.setFontSize(16);
    doc.setTextColor(21, 101, 192);
    doc.setFont("helvetica", "bold");
    doc.text(t('concepts_formed'), margen, y);
    y += 15;

    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text(t('concepts_from_selections'), margen, y);
    y += 10;

    // Los 3 conceptos formados
    const conceptosFormados = [
        { nombre: t('concept_formed') + " 1", grupos: [1, 4, 7, 10, 13] },
        { nombre: t('concept_formed') + " 2", grupos: [2, 5, 8, 11, 14] },
        { nombre: t('concept_formed') + " 3", grupos: [3, 6, 9, 12, 15] }
    ];

    let tieneConceptos = false;

    for (const concepto of conceptosFormados) {
        if (y > 240) {
            doc.addPage();
            y = margen;
        }

        doc.setFontSize(14);
        doc.setTextColor(13, 71, 161);
        doc.setFont("helvetica", "bold");
        doc.text(concepto.nombre, margen, y);
        y += 12;

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");

        let seleccionesCount = 0;

        // Mostrar las 5 ideas que forman este concepto
        for (let i = 0; i < concepto.grupos.length; i++) {
            const grupoKey = `pastel_grupo${concepto.grupos[i]}`;
            const seleccion = data[grupoKey] || t('no_selection');

            seleccionesCount++;
            tieneConceptos = true;

            doc.text(`${i + 1}. ${seleccion}`, margen + 10, y);
            y += 10;

            if (y > 280) {
                doc.addPage();
                y = margen;
            }
        }

        y += 10;
    }

    if (!tieneConceptos) {
        doc.text(t('no_concepts_formed'), margen, y);
        y += 10;
    }

    y += 15;

    // 8. EVALUACIÓN DE CONCEPTOS FORMADOS
    if (y > 220) {
        doc.addPage();
        y = margen;
    }

    doc.setFontSize(16);
    doc.setTextColor(21, 101, 192);
    doc.setFont("helvetica", "bold");
    doc.text(t('evaluation_concepts_formed'), margen, y);
    y += 15;

    let tieneEvalConceptos = false;

    for (let conc = 1; conc <= 3; conc++) {
        let tieneDatos = false;
        for (let i = 1; i <= 4; i++) {
            const key = `ca${(conc - 1) * 4 + i}`;
            if (data[key]) {
                tieneDatos = true;
                tieneEvalConceptos = true;
                break;
            }
        }

        if (tieneDatos) {
            if (y > 260) {
                doc.addPage();
                y = margen;
            }

            doc.setFontSize(14);
            doc.setTextColor(13, 71, 161);
            doc.setFont("helvetica", "bold");
            doc.text(`${t('concept_formed')} ${conc}`, margen, y);
            y += 12;

            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "normal");

            let total = 0;
            for (let i = 1; i <= 4; i++) {
                const key = `ca${(conc - 1) * 4 + i}`;
                const calif = parseFloat(data[key]) || 0;
                const peso = parseFloat(data[`peso${i}`]) || 0;
                total += calif * peso;
            }

            doc.text(`${t('final_score')}: ${total.toFixed(2)}`, margen + 10, y);
            y += 12;

            data[`resultado${conc + 3}`] = total.toFixed(2);
        }
    }

    if (!tieneEvalConceptos) {
        doc.text(t('no_evaluation_concepts'), margen, y);
        y += 10;
    }

    y += 15;

    // 9. MEJOR CONCEPTO SELECCIONADO - COMPLETO
    if (y > 230) {
        doc.addPage();
        y = margen;
    }

    doc.setFontSize(16);
    doc.setTextColor(21, 101, 192);
    doc.setFont("helvetica", "bold");
    doc.text(t('best_concept_selected'), margen, y);
    y += 15;

    // Buscar el mejor concepto
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

        // MOSTRAR QUÉ FORMA EL MEJOR CONCEPTO
        doc.setFontSize(14);
        doc.setTextColor(21, 101, 192);
        doc.setFont("helvetica", "bold");
        doc.text(t('composition_winner'), margen, y);
        y += 12;

        // Determinar qué grupos forman este concepto
        let gruposDelConcepto = [];
        if (mejorIndice === 1) {
            gruposDelConcepto = [1, 4, 7, 10, 13];
        } else if (mejorIndice === 2) {
            gruposDelConcepto = [2, 5, 8, 11, 14];
        } else {
            gruposDelConcepto = [3, 6, 9, 12, 15];
        }

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");

        // Mostrar cada una de las 5 ideas que forman el concepto
        for (let i = 0; i < gruposDelConcepto.length; i++) {
            const grupoKey = `pastel_grupo${gruposDelConcepto[i]}`;
            const seleccion = data[grupoKey] || t('idea_not_selected');

            if (y > 270) {
                doc.addPage();
                y = margen;
            }

            doc.text(`${i + 1}. ${seleccion}`, margen + 10, y);
            y += 10;
        }
    } else {
        doc.text(t('no_best_concept'), margen, y);
        y += 10;
    }

    y += 20;

    // 10. PREVENCIÓN DE RIESGOS - COMPLETO
    if (y > 220) {
        doc.addPage();
        y = margen;
    }

    doc.setFontSize(16);
    doc.setTextColor(21, 101, 192);
    doc.setFont("helvetica", "bold");
    doc.text(t('risk_prevention'), margen, y);
    y += 15;

    let tienePrevencion = false;

    for (let i = 1; i <= 3; i++) {
        // Verificar si hay datos para esta prevención
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

        // Verificar si hay al menos un dato
        if (falla || efecto || sev || ocu || riesgo || accionReal || responsable || fechaCell || accionTom || fecha) {
            tienePrevencion = true;

            if (y > 240) {
                doc.addPage();
                y = margen;
            }

            doc.setFontSize(14);
            doc.setTextColor(13, 71, 161);
            doc.setFont("helvetica", "bold");
            doc.text(`${t('prevention')} ${i}`, margen, y);
            y += 12;

            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "normal");

            // Mostrar TODOS los campos disponibles
            if (falla) {
                doc.text(`${t('potential_failure')} ${falla}`, margen + 10, y);
                y += 10;
            }

            if (efecto) {
                doc.text(`${t('effect')} ${efecto}`, margen + 10, y);
                y += 10;
            }

            if (sev) {
                doc.text(`${t('severity')} ${sev}`, margen + 10, y);
                y += 10;
            }
    
            if (ocu) {
                doc.text(`${t('occurrence')} ${ocu}`, margen + 10, y);
                y += 10;
            }
    
            if (riesgo) {
                doc.text(`${t('risk')} ${riesgo}`, margen + 10, y);
                y += 10;
            }       
    
            if (accionReal) {
                doc.text(`${t('actions_to_take')} ${accionReal}`, margen + 10, y);
                y += 10;
            }
    
            if (responsable) {
                doc.text(`${t('responsible')} ${responsable}`, margen + 10, y);
                y += 10;
            }
    
            if (fechaCell) {
                doc.text(`${t('today_date')} ${fechaCell}`, margen + 10, y);
                y += 10;
            }
    
            if (accionTom) {
                doc.text(`${t('action_taken')} ${accionTom}`, margen + 10, y);
                y += 10;
            }
    
            if (fecha) {
                doc.text(`${t('action_date')} ${fecha}`, margen + 10, y);
                y += 10;
            }
    
            y += 10;
    
            if (y > 280) {
                doc.addPage();
                y = margen;
            }
        }
    }

    if (!tienePrevencion) {
        doc.text(t('no_prevention_data'), margen, y);
        y += 10;
    }

    y += 15;

    // 11. PLAN DE ACCIÓN
    if (y > 230) {
        doc.addPage();
        y = margen;
    }

    doc.setFontSize(16);
    doc.setTextColor(21, 101, 192);
    doc.setFont("helvetica", "bold");
    doc.text(t('action_plan'), margen, y);
    y += 15;

    let tieneTareas = false;

    // Tareas 1-15
    doc.setFontSize(14);
    doc.setTextColor(13, 71, 161);
    doc.setFont("helvetica", "bold");
    doc.text(t('tasks_1_15'), margen, y);
    y += 12;

    for (let i = 1; i <= 15; i++) {
        const tarea = data[`tarea${i}`];
        const persona = data[`persona${i}`];

        if (tarea || persona) {
            tieneTareas = true;
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "normal");
            doc.text(`${i}. ${persona || ""} - ${tarea || ""}`, margen + 10, y);
            y += 10;
    
            if (y > 280) {
                doc.addPage();
                y = margen;
            }
        }
    }

    y += 15;

    // Tareas 16-30
    if (y > 250) {
        doc.addPage();
        y = margen;
    }

    doc.setFontSize(14);
    doc.setTextColor(13, 71, 161);
    doc.setFont("helvetica", "bold");
    doc.text(t('tasks_16_30'), margen, y);
    y += 12;

    for (let i = 16; i <= 30; i++) {
        const tarea = data[`tarea${i}`];
        const persona = data[`persona${i}`];

        if (tarea || persona) {
            tieneTareas = true;
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "normal");
            doc.text(`${i}. ${persona || ""} - ${tarea || ""}`, margen + 10, y);
            y += 10;
    
            if (y > 280) {
                doc.addPage();
                y = margen;
            }
        }
    }

    if (!tieneTareas) {
        doc.text(t('no_tasks'), margen, y);
        y += 10;
    }

    // 12. FIN DEL DOCUMENTO
    const finalY = doc.internal.pageSize.height - 20;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`${t('document_generated')} ${hoy}`, anchoPagina / 2, finalY, { align: "center" });

    // Guardar PDF
    pdfBlob = doc.output('blob');
    filename = `informe_${(data.projectName || 'proyecto').replace(/ /g, '_')}.pdf`;
    
    // Actualizar nombre del archivo en la interfaz
    const filenameDisplay = document.getElementById('filenameDisplay');
    if (filenameDisplay) {
        filenameDisplay.textContent = filename;
    }

    // Descarga automática
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
    
    // Cargar lang.js si existe
    await loadLangJS();
    
    // Obtener idioma actual
    currentLang = localStorage.getItem('preferredLanguage') || 'es';
    
    // Actualizar interfaz
    updateInterface();
    
    // Configurar selector de idioma
    const langSelector = document.getElementById('languageSelector');
    if (langSelector) {
        langSelector.value = currentLang;
        
        langSelector.addEventListener('change', function() {
            currentLang = this.value;
            localStorage.setItem('preferredLanguage', currentLang);
            
            // Actualizar interfaz
            updateInterface();
            
            // Si existe setLanguage en lang.js, llamarlo
            if (typeof window.setAppLanguage === 'function') {
                window.setAppLanguage(currentLang);
            }
        });
    }
    
    // Configurar tema oscuro
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
    
    // Botón para descargar nuevamente
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
    
    // Inicializar nombre del archivo
    const filenameDisplay = document.getElementById('filenameDisplay');
    if (filenameDisplay) {
        filename = `informe_${(data.projectName || 'proyecto').replace(/ /g, '_')}.pdf`;
        filenameDisplay.textContent = filename;
    }
    
    // Generar PDF automáticamente después de un breve retraso
    setTimeout(function() {
        console.log("Generando PDF automáticamente...");
        generarPDF();
    }, 1000);
}

// =============================================
// EJECUCIÓN PRINCIPAL
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    initialize().catch(error => {
        console.error("Error en inicialización:", error);
    });
});

// =============================================
// MANEJO DE ERRORES
// =============================================
window.addEventListener('error', function(event) {
    console.error('Error global capturado:', event.error);
});