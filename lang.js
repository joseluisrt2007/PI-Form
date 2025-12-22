// lang.js - Sistema de traducción centralizado
const translations = {
    'es': {
        // =================== GENERAL ===================
        'app_title': 'Desarrollo de Formularios para Actividades de Mejora',
        'main_menu': 'Menú Principal',
        'project': 'Proyecto:',
        'unnamed_project': '(Sin nombre)',
        
        // =================== NUEVAS TRADUCCIONES PARA DESCRIPCIÓN ===================
        'project_description': 'Descripción del proyecto',
        'enter_project_description': 'Describa el objetivo, alcance y detalles del proyecto...',
        'error_project_description': 'Ingresa una descripción para el proyecto',
        
        // =================== BOTONES ===================
        'save_continue': '💾 Guardar y continuar',
        'back': '◀️ Regreso',
        'start': '🚀 Iniciar',
        'calculate': '🧮 Calcular',
        'download_pdf': '📄 Descargar PDF nuevamente',
        'return_main_menu': '🏠 Volver al menú principal',
        'risk_calculation': '⚠️ Calcular riesgo',
        'theme_light': 'Cambiar a modo claro',
        'theme_dark': 'Cambiar a modo oscuro',
        
        // =================== ERRORES ===================
        'error_sum_weights': 'La suma de los pesos debe ser exactamente 10',
        'error_ratings': 'Complete todas las calificaciones (0-10).',
        'error_ratings_range': 'Las calificaciones deben estar entre 0 y 10.',
        'error_severity_occurrence': 'Severidad y Ocurrencia deben ser números enteros entre 1 y 10.',
        
        // NUEVOS ERRORES PARA CRITERIOS.HTML
        'error_at_least_one_concept': 'Ingresa al menos una idea/concepto',
        'error_project_name': 'Ingresa un nombre para el proyecto',
        'error_all_criteria': 'Completa todos los criterios',
        'error_all_weights': 'Ingresa un peso para cada criterio',
        
        // =================== NUEVO ERROR PARA EVALUACION ===================
        'error_calculate_all': 'Debes calcular todos los conceptos antes de continuar',
        
        // =================== PÁGINAS ===================
        'criteria_weights': 'Criterios y pesos',
        'ideas_concepts': 'Ideas',
        'concept_evaluation': 'Evaluación',
        'explore_possibilities': 'Exploración de Opciones',
        'concept_formation': 'Formación de Conceptos',
        'risk_prevention': 'Prevenir',
        'diagram': 'Diagrama',
        'diagram_pt2': 'Diagrama pt.2',
        'results': 'Resultados',
        
        // =================== TABLAS ===================
        'criteria': 'Criterio',
        'weight': 'Peso',
        'idea': 'Idea',
        'rating': 'Calificación (0-10)',
        'result': 'Resultado',
        'options':'Opcion',
        'option': 'Concepto',
        'possibilities': 'Explorar opciones',
        'tasks_responsibles': 'Enlace de entradas y salidas a través de funciones/tareas',
        
        // =================== CONCEPTOS ===================
        'best_concept': 'Mejor Concepto',
        'no_concept_selected': 'Ninguno seleccionado',
        'concept_composition': 'Opciones que componen este concepto:',
        'concept_formed': 'Concepto Formado',
        'options_forming_concept': 'Opciones que componen este concepto:',
        
        // =================== PREVENCIÓN DE RIESGOS ===================
        'potential_failure': 'Falla potencial',
        'effect': 'Efecto',
        'severity': 'Severidad (1-10)',
        'occurrence': 'Ocurrencia (1-10)',
        'risk': 'Riesgo',
        'actions_to_take': 'Acción/Acciones a realizar',
        'responsible': 'Responsable',
        'today_date': 'Fecha de hoy',
        'action_taken': 'Acción tomada',
        'action_date': 'Fecha en la que se realizó la acción',
        'prevention': 'Prevención',
        
        // =================== DIAGRAMA/TAREAS ===================
        'task': 'Tarea',
        'responsable_label': 'Entrada',
        'task_label': 'Funcion/Tarea',
        'salida_label': 'Salida',
        'enter_salida': 'Describe la salida',
        'tasks_1_15': 'Tareas 1-15',
        'tasks_16_30': 'Tareas 16-30',
        
        // =================== PDF Y RESULTADOS ===================
        'pdf_generated': '¡Informe generado con éxito!',
        'pdf_download_info': 'El informe PDF de su proyecto ha sido generado y descargado automáticamente.',
        'pdf_filename': 'Nombre del archivo:',
        'generate_pdf': 'Generar PDF',
        'report_generated': 'Informe generado',
        'download_again': 'Descargar nuevamente',
        
        // =================== FORMULARIOS ===================
        'project_name': 'Nombre del proyecto',
        'enter_project_name': 'Ingrese el nombre del proyecto',
        'enter_possibility': 'Ingrese posibilidad',
        'enter_criteria': 'Ingrese criterio',
        'enter_weight': 'Ingrese peso',
        'enter_idea': 'Ingrese idea',
        'enter_rating': 'Ingrese calificación (0-10)',
        'enter_severity': 'Ingrese severidad (1-10)',
        'enter_occurrence': 'Ingrese ocurrencia (1-10)',
        'enter_task': 'Ingresa tarea',
        'enter_responsible': 'Ingresa responsable',
        
        // =================== GC1 (FORMACIÓN DE CONCEPTOS) ===================
        'select_option': 'Seleccionar opción',
        'no_selection': 'Sin selección',
        'selected_option': 'Opción seleccionada',
        'concept_options': 'Opciones que componen este concepto:',
        
        // =================== EVAL CONCEPTOS ===================
        'evaluation_concepts_formed': 'Evaluación de Conceptos Formados',
        'concepts_formed': 'Conceptos Formados',
        
        // =================== MENSAJES VARIOS ===================
        'loading': 'Cargando...',
        'saving': 'Guardando...',
        'calculating': 'Calculando...',
        'no_data': 'No hay datos',
        'select': 'Seleccionar',
        'confirm': 'Confirmar',
        'cancel': 'Cancelar',
        'close': 'Cerrar',
        
        // =================== PIE DE PÁGINA ===================
        'footer_text': 'José Luis Rodríguez Téllez — ITESM Hidalgo — Salvador Gonzáles García'
    },
    
    'en': {
        // =================== GENERAL ===================
        'app_title': 'Development of Forms for Improvement Activities',
        'main_menu': 'Main Menu',
        'project': 'Project:',
        'unnamed_project': '(Unnamed)',
        
        // =================== NEW TRANSLATIONS FOR DESCRIPTION ===================
        'project_description': 'Project Description',
        'enter_project_description': 'Describe the objective, scope and details of the project...',
        'error_project_description': 'Enter a description for the project',
        
        // =================== BUTTONS ===================
        'save_continue': '💾 Save and continue',
        'back': '◀️ Back',
        'start': '🚀 Start',
        'calculate': '🧮 Calculate',
        'download_pdf': '📄 Download PDF again',
        'return_main_menu': '🏠 Return to main menu',
        'risk_calculation': '⚠️ Calculate risk',
        'theme_light': 'Switch to light mode',
        'theme_dark': 'Switch to dark mode',
        
        // =================== ERRORS ===================
        'error_sum_weights': 'Sum of weights must be exactly 10',
        'error_ratings': 'Complete all ratings (0-10).',
        'error_ratings_range': 'Ratings must be between 0 and 10.',
        'error_severity_occurrence': 'Severity and Occurrence must be integers between 1 and 10.',
        
        // NEW ERRORS FOR CRITERIOS.HTML
        'error_at_least_one_concept': 'Enter at least one idea/concept',
        'error_project_name': 'Enter a project name',
        'error_all_criteria': 'Complete all criteria',
        'error_all_weights': 'Enter a weight for each criteria',
        
        // =================== NEW ERROR FOR EVALUATION ===================
        'error_calculate_all': 'You must calculate all concepts before continuing',
        
        // =================== PAGES ===================
        'criteria_weights': 'Criteria and weights',
        'ideas_concepts': 'Ideas',
        'concept_evaluation': 'Evaluation',
        'explore_possibilities': 'Explore Options',
        'concept_formation': 'Concept Formation',
        'risk_prevention': 'Risk Prevention',
        'diagram': 'Diagram',
        'diagram_pt2': 'Diagram pt.2',
        'results': 'Results',
        
        // =================== TABLES ===================
        'criteria': 'Criteria',
        'weight': 'Weight',
        'idea': 'Idea',
        'rating': 'Rating (0-10)',
        'result': 'Result',
        'options':'Option',
        'option': 'Concept',
        'possibilities': 'Explore options',
        'tasks_responsibles': 'Linking inputs and outputs through functions/tasks',
        
        // =================== CONCEPTS ===================
        'best_concept': 'Best Concept',
        'no_concept_selected': 'None selected',
        'concept_composition': 'Options that form this concept:',
        'concept_formed': 'Concept Formed',
        'options_forming_concept': 'Options that form this concept:',
        
        // =================== RISK PREVENTION ===================
        'potential_failure': 'Potential failure',
        'effect': 'Effect',
        'severity': 'Severity (1-10)',
        'occurrence': 'Occurrence (1-10)',
        'risk': 'Risk',
        'actions_to_take': 'Action/Actions to take',
        'responsible': 'Responsible',
        'today_date': 'Today\'s date',
        'action_taken': 'Action taken',
        'action_date': 'Date when action was taken',
        'prevention': 'Prevention',
        
        // =================== DIAGRAMA/TASKS ===================
        'task': 'Task',
        'responsable_label': 'Input',
        'task_label': 'Function/Task',
        'salida_label': 'Output',
        'enter_salida': 'Describe the output',
        'tasks_1_15': 'Tasks 1-15',
        'tasks_16_30': 'Tasks 16-30',
        
        // =================== PDF AND RESULTS ===================
        'pdf_generated': 'Report generated successfully!',
        'pdf_download_info': 'Your project PDF report has been generated and downloaded automatically.',
        'pdf_filename': 'Filename:',
        'generate_pdf': 'Generate PDF',
        'report_generated': 'Report generated',
        'download_again': 'Download again',
        
        // =================== FORMS ===================
        'project_name': 'Project name',
        'enter_project_name': 'Enter project name',
        'enter_possibility': 'Enter possibility',
        'enter_criteria': 'Enter criteria',
        'enter_weight': 'Enter weight',
        'enter_idea': 'Enter idea',
        'enter_rating': 'Enter rating (0-10)',
        'enter_severity': 'Enter severity (1-10)',
        'enter_occurrence': 'Enter occurrence (1-10)',
        'enter_task': 'Enter task',
        'enter_responsible': 'Enter responsible',
        
        // =================== GC1 (CONCEPT FORMATION) ===================
        'select_option': 'Select option',
        'no_selection': 'No selection',
        'selected_option': 'Selected option',
        'concept_options': 'Options that form this concept:',
        
        // =================== EVAL CONCEPTS ===================
        'evaluation_concepts_formed': 'Evaluation of Formed Concepts',
        'concepts_formed': 'Formed Concepts',
        
        // =================== VARIOUS MESSAGES ===================
        'loading': 'Loading...',
        'saving': 'Saving...',
        'calculating': 'Calculating...',
        'no_data': 'No data',
        'select': 'Select',
        'confirm': 'Confirm',
        'cancel': 'Cancel',
        'close': 'Close',
        
        // =================== FOOTER ===================
        'footer_text': 'José Luis Rodríguez Téllez — ITESM Hidalgo — Salvador Gonzáles García'
    }
};

// El resto del archivo lang.js permanece igual...
// ========== SISTEMA DE TRADUCCIÓN (CONTINUACIÓN) ==========

// Sistema de traducción
let currentLang = localStorage.getItem('preferredLanguage') || 'es';

function setLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        localStorage.setItem('preferredLanguage', lang);
        applyTranslations();
        return true;
    }
    return false;
}

function t(key, variables = {}) {
    let text = translations[currentLang][key] || key;
    
    // Reemplazar variables {{variable}}
    Object.keys(variables).forEach(varName => {
        const pattern = new RegExp(`{{${varName}}}`, 'g');
        text = text.replace(pattern, variables[varName]);
    });
    
    return text;
}

function applyTranslations() {
    // 1. Texto en elementos con data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const text = t(key);
        
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.placeholder = text;
        } else if (el.tagName === 'TITLE') {
            el.textContent = text;
        } else if (el.tagName === 'SELECT') {
            // Para selects, buscar la opción con value="key" y traducir su texto
            const option = el.querySelector(`option[value="${key}"]`);
            if (option) option.textContent = text;
        } else {
            el.textContent = text;
        }
    });
    
    // 2. Placeholders específicos
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });
    
    // 3. Atributos title
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        el.title = t(el.getAttribute('data-i18n-title'));
    });
    
    // 4. Atributos value para inputs
    document.querySelectorAll('[data-i18n-value]').forEach(el => {
        el.value = t(el.getAttribute('data-i18n-value'));
    });
    
    // 5. Atributos alt para imágenes
    document.querySelectorAll('[data-i18n-alt]').forEach(el => {
        el.alt = t(el.getAttribute('data-i18n-alt'));
    });
    
    // 6. Actualizar el pie de página si existe
    const footer = document.querySelector('footer[role="contentinfo"]');
    if (footer && !footer.hasAttribute('data-i18n')) {
        footer.textContent = t('footer_text');
    }
    
    // 7. Disparar evento personalizado para que otras funciones sepan que las traducciones se aplicaron
    window.dispatchEvent(new CustomEvent('translationsApplied', { detail: { lang: currentLang } }));
}

// Cargar traducciones al iniciar
document.addEventListener('DOMContentLoaded', function() {
    applyTranslations();
    
    // Configurar automáticamente cualquier selector de idioma que exista
    const langSelectors = document.querySelectorAll('select[id*="language"], select[name*="language"]');
    langSelectors.forEach(selector => {
        selector.value = currentLang;
        selector.addEventListener('change', function() {
            setLanguage(this.value);
        });
    });
});

// Para usar en alertas
function alertTranslated(key, variables = {}) {
    alert(t(key, variables));
}

// Para usar en confirmaciones
function confirmTranslated(key, variables = {}) {
    return confirm(t(key, variables));
}

// Para logs de consola (útil para debugging)
function logTranslated(key, variables = {}, level = 'log') {
    const message = t(key, variables);
    switch(level) {
        case 'error': console.error(message); break;
        case 'warn': console.warn(message); break;
        case 'info': console.info(message); break;
        default: console.log(message);
    }
}

// Función para traducir fechas (formato corto según idioma)
function formatDate(date, format = 'short') {
    const options = {
        'es': {
            'short': { day: '2-digit', month: '2-digit', year: 'numeric' },
            'long': { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
        },
        'en': {
            'short': { month: 'short', day: '2-digit', year: 'numeric' },
            'long': { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
        }
    };
    
    return date.toLocaleDateString(currentLang === 'es' ? 'es-ES' : 'en-US', options[currentLang][format]);
}

// Para facilitar el acceso desde otros archivos
window.translate = t;
window.setAppLanguage = setLanguage;
window.getCurrentLanguage = () => currentLang;
window.alertT = alertTranslated;
window.confirmT = confirmTranslated;
window.logT = logTranslated;
window.formatDateT = formatDate;

// Exportar para módulos (si se usa type="module")
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        t,
        setLanguage,
        getCurrentLanguage: () => currentLang,
        alertTranslated,
        confirmTranslated,
        formatDate
    };
}