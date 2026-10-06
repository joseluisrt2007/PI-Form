/**
 * ============================================================================
 * i18n/pdf.js  ->  PFM.pdfStrings  (textos del informe PDF)
 * ============================================================================
 * Textos del informe PDF (es / en). Se usan con PFM.pdf.t('clave') (alias ctx.t en las
 * secciones) de js/pdf/context.js. Son independientes de los textos de la interfaz
 * (i18n/es.js, i18n/en.js): aquí, por ejemplo, los títulos van en MAYÚSCULAS. Cada clave
 * debe existir en ambos idiomas.
 *
 * ESTRUCTURA: PFM.pdfStrings = { es: { clave: texto }, en: { clave: texto } }
 * (distinta de PFM.translations, que es { es, en } de la interfaz). El idioma lo da
 * PFM.i18n.getLang() EN EL MOMENTO de generar el PDF.
 *
 * CONVENCION DE CLAVES: snake_case en inglés, igual en ambos idiomas. Los títulos de
 * sección van en mayúsculas ('CRITERIOS Y PESOS'); las etiquetas de campos de prevención
 * ('potential_failure', 'severity'...) llevan "• " delante y ":" al final dentro del texto,
 * porque la sección los imprime tal cual. Los comentarios agrupan las claves por la
 * sección del informe que las usa (js/pdf/sections/<nombre>.js).
 *
 * AGREGAR UNA CLAVE: añadirla en `es` Y en `en` y llamarla con ctx.t('clave'). Si falta,
 * PFM.pdf.t devuelve la propia clave y se verá como texto crudo en el PDF.
 * AGREGAR UN IDIOMA: añadir un bloque `fr: {...}` con TODAS las claves, y también el
 * idioma en i18n/es.js / en.js (ver la cabecera de i18n/es.js). La fuente del PDF
 * (helvetica de jsPDF) solo cubre caracteres latinos; otros alfabetos no se imprimirían bien.
 *
 * Carga: solo en resultados.html, antes de js/pdf/context.js (y de report.js).
 * localStorage: no lee ni escribe nada.
 *
 * CUIDADO: la portada (sections/portada.js) usa un texto fijo ('Proyecto sin nombre' /
 * 'Unnamed project') en lugar de 'unnamed_project', que solo usa sections/info-proyecto.js.
 * Antes de borrar una clave, buscarla con grep en js/pdf/ (prevencion.js arma algunas
 * claves de forma dinámica: t(etiqueta)).
 * ============================================================================
 */
(function (PFM) {
    PFM.pdfStrings = {
        es: {
        // --- PORTADA Y DATOS GENERALES ---
        'unnamed_project': '(Sin nombre)',
        'complete_project_report': 'INFORME COMPLETO DE PROYECTO',
        'generated_on': 'Generado el:',
        // --- INFORMACION DEL PROYECTO (section info-proyecto) ---
        'project_information': 'INFORMACIÓN DEL PROYECTO',
        'project_name_label': 'Nombre del proyecto:',
        'description_label': 'Descripción:',
        'no_description': '(Sin descripción)',
        // --- CRITERIOS Y PESOS (section criterios) ---
        'criteria_weights': 'CRITERIOS Y PESOS',
        'criteria': 'Criterio',
        'weight': 'Peso',
        'total_sum_weights': 'SUMA TOTAL DE PESOS:',
        // --- IDEAS INICIALES Y SU EVALUACION (secciones ideas, evaluacion-ideas, evaluacion-funciones) ---
        'ideas_concepts': 'IDEAS / CONCEPTOS INICIALES',
        'idea': 'Idea',
        'initial_evaluation': 'EVALUACIÓN INICIAL DE IDEAS',
        'diagram_evaluation_section': 'EVALUACIÓN DE FUNCIONES DEL DIAGRAMA',
        // --- EXPLORACION DE OPCIONES (section exploracion) ---
        'for': 'Para',
        'options': 'Opción',
        'explore_possibilities': 'EXPLORACIÓN DE OPCIONES',
        // --- FORMACION Y EVALUACION DE CONCEPTOS (secciones formacion, conceptos-formados, evaluacion-conceptos) ---
        'concept_formation': 'FORMACIÓN DE CONCEPTOS',
        'checkbox_selections': '(Selecciones realizadas con checkboxes)',
        'selection_summary': 'Resumen de selecciones por grupo:',
        'concepts_formed': 'CONCEPTOS FORMADOS',
        'concepts_from_selections': '(Los 3 conceptos creados a partir de las selecciones)',
        'concept_formed': 'Concepto Formado',
        'no_selection': '(Sin selección)',
        'evaluation_concepts_formed': 'EVALUACIÓN DE CONCEPTOS FORMADOS',
        'final_score': 'Puntuación final',
        // --- MEJOR CONCEPTO (section mejor-concepto) ---
        'best_concept_selected': 'MEJOR CONCEPTO SELECCIONADO',
        'score_obtained': 'Puntuación obtenida',
        'composition_winner': 'COMPOSICIÓN DEL CONCEPTO GANADOR:',
        'idea_not_selected': '(Idea no seleccionada)',
        'no_best_concept_yet': '(Aún no se ha calculado ninguna puntuación de conceptos)',
        // --- PREVENCION DE RIESGOS (section prevencion; los textos con "• " y ":" ya los llevan incluidos) ---
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
        // --- PLAN DE ACCION Y CIERRE (secciones plan-accion y cierre) ---
        'action_plan': 'PLAN DE ACCIÓN',
        'document_generated': 'Documento generado el',
        },
        en: {
        // --- PORTADA Y DATOS GENERALES ---
        'unnamed_project': '(Unnamed)',
        'complete_project_report': 'COMPLETE PROJECT REPORT',
        'generated_on': 'Generated on:',
        // --- INFORMACION DEL PROYECTO (section info-proyecto) ---
        'project_information': 'PROJECT INFORMATION',
        'project_name_label': 'Project name:',
        'description_label': 'Description:',
        'no_description': '(No description)',
        // --- CRITERIOS Y PESOS (section criterios) ---
        'criteria_weights': 'CRITERIA AND WEIGHTS',
        'criteria': 'Criteria',
        'weight': 'Weight',
        'total_sum_weights': 'TOTAL SUM OF WEIGHTS:',
        // --- IDEAS INICIALES Y SU EVALUACION (secciones ideas, evaluacion-ideas, evaluacion-funciones) ---
        'ideas_concepts': 'INITIAL IDEAS / CONCEPTS',
        'idea': 'Idea',
        'initial_evaluation': 'INITIAL EVALUATION OF IDEAS',
        'diagram_evaluation_section': 'ACTIVITY DIAGRAM FUNCTION EVALUATION',
        // --- EXPLORACION DE OPCIONES (section exploracion) ---
        'for': 'For',
        'options': 'Option',
        'explore_possibilities': 'EXPLORATION OF OPTIONS',
        // --- FORMACION Y EVALUACION DE CONCEPTOS (secciones formacion, conceptos-formados, evaluacion-conceptos) ---
        'concept_formation': 'CONCEPT FORMATION',
        'checkbox_selections': '(Selections made with checkboxes)',
        'selection_summary': 'Selection summary by group:',
        'concepts_formed': 'FORMED CONCEPTS',
        'concepts_from_selections': '(The 3 concepts created from the selections)',
        'concept_formed': 'Concept Formed',
        'no_selection': '(No selection)',
        'evaluation_concepts_formed': 'EVALUATION OF FORMED CONCEPTS',
        'final_score': 'Final score',
        // --- MEJOR CONCEPTO (section mejor-concepto) ---
        'best_concept_selected': 'BEST CONCEPT SELECTED',
        'score_obtained': 'Score obtained',
        'composition_winner': 'COMPOSITION OF THE WINNING CONCEPT:',
        'idea_not_selected': '(Idea not selected)',
        'no_best_concept_yet': '(No concept score has been calculated yet)',
        // --- PREVENCION DE RIESGOS (section prevencion; los textos con "• " y ":" ya los llevan incluidos) ---
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
        // --- PLAN DE ACCION Y CIERRE (secciones plan-accion y cierre) ---
        'action_plan': 'ACTION PLAN',
        'document_generated': 'Document generated on',
        }
    };
})(window.PFM = window.PFM || {});
