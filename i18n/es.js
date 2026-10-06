/**
 * ============================================================================
 * i18n/es.js  ->  PFM.translations.es  (textos de la interfaz en español)
 * ============================================================================
 * Traducciones de la interfaz — español. Cada clave debe existir también en el otro
 * idioma (i18n/en.js). Se usan con data-i18n="clave" en el HTML o con
 * PFM.i18n.t('clave') en JS.
 *
 * CONVENCION DE CLAVES
 *   - Clave en snake_case en inglés ('save', 'error_sum_weights', 'enter_idea'),
 *     igual en TODOS los idiomas; solo cambia el valor. Prefijos habituales:
 *     error_* (mensajes de validación), enter_* (placeholders), yes_/no_/ask_*
 *     (preguntas de módulos), theme_* (tooltips del botón de tema).
 *   - Las claves se agrupan por tema con comentarios de sección (// GENERAL, // BOTONES...);
 *     el agrupado es solo visual, no tiene efecto.
 *   - Marcadores: un valor puede llevar {{nombre}}; PFM.i18n.t(clave, { nombre: valor })
 *     lo sustituye (core/i18n.js).
 *   - Los textos con emoji ('💾 Guardar') llevan el emoji dentro del valor.
 *
 * ESTRUCTURA: PFM.translations es un objeto { es: {...}, en: {...} }. Este archivo
 * añade la entrada `es` (crea PFM.translations si aún no existe); core/i18n.js lo lee
 * al cargarse, por eso i18n/es.js y en.js deben cargarse ANTES que core/i18n.js.
 *
 * AGREGAR UNA CLAVE: añadirla en es.js Y en en.js (y en cada idioma extra). Si falta en
 * un idioma, PFM.i18n.t() devuelve la propia clave como texto visible. Luego usarla con
 * data-i18n="clave" (o data-i18n-placeholder / -title / -value / -alt) o t('clave').
 *
 * AGREGAR UN IDIOMA (p. ej. fr): 1) copiar este archivo a i18n/fr.js y cambiar
 * `PFM.translations.es` por `PFM.translations.fr`, traduciendo SOLO los valores;
 * 2) cargarlo con <script> en CADA HTML antes de js/core/i18n.js; 3) añadir
 * <option value="fr"> al <select id="languageSelector"> de cada HTML; 4) en
 * core/i18n.js, añadir la entrada del idioma en las opciones de formatDate (y el locale
 * en su llamada a toLocaleDateString); 5) añadir 'fr' en i18n/pdf.js y
 * i18n/resultados.js, que tienen sus propias tablas por idioma.
 *
 * CUIDADO: hay valores repetidos con distinta clave ('concept_composition' y
 * 'options_forming_concept' son el mismo texto; 'prevention' repite a 'potential_failure').
 * Se conservan sin unificar porque cada página (prevenir.js, evalConceptos.js...) las pide
 * por su nombre; borrar una rompería esa página. Antes de eliminar una clave, busca su uso
 * en los .html y .js (data-i18n y t('clave')): la limpieza de claves sin uso ya se hizo.
 * Excepción: assistant_greeting_<página> se pide de forma dinámica (assistant.js: `assistant_greeting_${page}`).
 * ============================================================================
 */
(function (PFM) {
    PFM.translations = PFM.translations || {};
    PFM.translations.es = {
        // GENERAL
        'app_title': 'Herramientas del Pensamiento de Diseño para Actividades de Mejora',
        'main_menu': 'Menú Principal',
        'project': 'Proyecto:',
        'unnamed_project': '(Sin nombre)',
        
        // NUEVAS TRADUCCIONES PARA DESCRIPCIÓN
        'project_description': 'Descripción del proyecto',
        'enter_project_description': 'Describa el objetivo, alcance y detalles del proyecto...',
        
        // NUEVAS TRADUCCIONES PARA MENÚ DE MÓDULOS (descripcion.html)
        'modules_menu_title': 'Selecciona los módulos a realizar',
        'modules_menu_subtitle': 'Elige qué partes del proceso quieres completar. Solo esas páginas, resultados y secciones del PDF se incluirán.',
        'module_initial_analysis': 'Análisis Inicial',
        'module_initial_analysis_desc': 'Criterios y pesos (necesidades del proyecto)',
        'module_required_badge': 'Obligatorio',
        'module_definition_ideas': 'Definición y Análisis de Ideas',
        'module_definition_ideas_desc': 'Ideas/conceptos iniciales y su evaluación',

        // NUEVAS TRADUCCIONES PARA SELECCIÓN DE ELEMENTOS A EVALUAR (seleccionEvaluar.html)
        'select_elements_title': 'Selección de Elementos a Evaluar',
        'select_elements_label': 'SELECCIÓN',
        'select_elements_subtitle': 'Elige los elementos que deseas incluir en la evaluación · Edita el nombre con el ícono de lápiz',
        'select_elements_none': 'No hay elementos disponibles. Activa el módulo "Definición de Ideas" o "Diagrama de Actividades" en la página de descripción.',
        'select_group_ideas': 'Ideas / Conceptos',
        'select_group_tasks': 'Funciones del Diagrama de Actividades',

        // NUEVAS TRADUCCIONES PARA OPCION DIAGRAMAS
        'diagram_question': 'Diagrama de Actividades',
        'ask_diagram': '¿Quieres realizar los diagramas de funciones?',
        
        // NUEVAS TRADUCCIONES PARA OPCION CONCEPTOS
        'concept_question': 'Exploración y Evaluación de Conceptos',
        'ask_concept': '¿Deseas hacer la exploración y evaluación de conceptos?',
        
        // NUEVAS TRADUCCIONES PARA OPCION PREVENCION
        'prevention_question': 'Prevención de Riesgos',
        'ask_prevention': '¿Deseas realizar el análisis de prevención de riesgos?',
        
        // BOTONES (MODIFICADO: Separar Guardar y Continuar)
        'save': '💾 Guardar',
        'continue': '➡️ Continuar',
        'back': '◀️ Regreso',
        'load_necesidades': '📂 Cargar Necesidades',
        'save_necesidades': '💾 Guardar Necesidades',
        'load_ideas': '📂 Cargar Ideas',
        'save_ideas': '💾 Guardar Ideas',
        'load_evaluacion': '📂 Cargar Evaluación',
        'save_evaluacion': '💾 Guardar Evaluación',
        'error_loading_file': 'No se pudo leer el archivo. Verifica que sea un archivo .txt válido generado por esta aplicación.',
        'start': '🚀 Iniciar',
        'calculate': '🧮 Calcular',
        'download_pdf': '📄 Descargar PDF nuevamente',
        'return_main_menu': '🏠 Volver al menú principal',
        'risk_calculation': '⚠️ Calcular riesgo',
        'theme_light': 'Cambiar a modo claro',
        'theme_dark': 'Cambiar a modo oscuro',
        
        // ERRORES 
        'error_sum_weights': 'La suma de los pesos debe ser exactamente 10',
        
        // PÁGINAS 
        'description_data': 'Descripción',
        'criteria_weights': 'Necesidades y prioridades',
        'ideas_concepts': 'Ideas',
        'concept_evaluation': 'Evaluación de ideas',
        'explore_possibilities': 'Exploración de Opciones',
        'concept_formation': 'Formación de Conceptos',
        'risk_prevention': 'Prevenir',
        'diagram': 'Diagrama de funciones',
        
        // TABLAS 
        'criteria': 'Necesidad',
        'weight': 'Prioridad',
        'idea': 'Idea',
        'rating': 'Calificación (0-10)',
        'result': 'Resultado',
        'options':'Opcion',
        'option': 'Concepto',
        'possibilities': 'Explorar opciones',
        'tasks_responsibles': 'Enlace de entradas y salidas a través de funciones',
        
        // CONCEPTOS 
        'best_concept': 'Mejor Concepto',
        'no_concept_selected': 'Ninguno seleccionado',
        'concept_composition': 'Opciones que componen este concepto:',
        'concept_formed': 'Concepto Formado',
        'options_forming_concept': 'Opciones que componen este concepto:',
        
        // PREVENCIÓN DE RIESGOS
        'potential_failure': 'Falla potencial',
        'effect': 'Efecto',
        'severity': 'Severidad (1-10)',
        'occurrence': 'Ocurrencia (1-10)',
        'risk': 'Riesgo',
        'actions_to_take': 'Acción/Acciones a realizar',
        'responsible': 'Responsable',
        'today_date': 'Fecha de registro',
        'action_taken': 'Acción tomada',
        'action_date': 'Fecha en la que se realizó la acción',
        'prevention': 'Falla potencial',
        
        // DIAGRAMA/TAREAS 
        'responsable_label': 'Entrada',
        'task_label': 'Funcion',
        'salida_label': 'Salida',
        'enter_salida': 'Describe la salida',
        'add_row': 'Agregar fila',
        // Avisos de celda/flecha oculta en diagrama.html
        'click_to_show': '👆 Click para mostrar',
        'click_to_show_arrow': '👆 Click para mostrar flecha',
        // Botón de agregar tabla en prevenir.html
        'add_prevention': '+ Agregar Prevención',
        // Avisos cuando no hay elementos (morfologia, evalConceptos, evaluacion)
        'no_concepts_defined': 'No hay conceptos definidos. Regresa a la página anterior para ingresar conceptos.',
        'no_elements_to_evaluate': 'No hay elementos seleccionados para evaluar. Regresa a la página anterior y selecciona al menos uno.',
        // Diálogos (prevenir: confirmar borrado; resultados: falta la librería jsPDF)
        'confirm_delete_prevention': '¿Eliminar esta prevención?',
        'error_jspdf_missing': 'Error: No se puede generar el PDF. jsPDF no está cargado.',
        
        // PDF Y RESULTADOS
        'pdf_download_info': 'El informe PDF de su proyecto ha sido generado y descargado automáticamente.',
        'pdf_filename': 'Nombre del archivo:',
        'report_generated': 'Informe generado',
        
        // FORMULARIOS 
        'project_name': 'Nombre del proyecto',
        'enter_project_name': 'Ingrese el nombre del proyecto',
        'enter_possibility': 'Ingrese posibilidad',
        'enter_rating': 'Ingrese calificación (0-10)',
        'enter_severity': 'Ingrese severidad (1-10)',
        'enter_occurrence': 'Ingrese ocurrencia (1-10)',
        'enter_task': 'Ingresa tarea',
        'enter_responsible': 'Ingresa la entrada',
        
        // GC1 (FORMACIÓN DE CONCEPTOS) 
        'no_selection': 'Sin selección',
        
        // EVAL CONCEPTOS 
        'evaluation_concepts_formed': 'Evaluación de Conceptos Formados',
        'concepts_formed': 'Conceptos Formados',
        
        // ASISTENTE IA (js/features/assistant.js)
        'assistant_title': '🤖 Asistente IA',
        'assistant_toggle': 'Asistente IA',
        'assistant_close': 'Cerrar',
        'assistant_file_ready': '📄 El asistente generó un archivo listo para usar.',
        'assistant_insert': '📥 Insertar en el formulario',
        'assistant_download': '💾 Descargar .txt',
        'assistant_placeholder': 'Escribe aquí...',
        'assistant_send': 'Enviar',
        'assistant_typing': 'Escribiendo...',
        'assistant_error_generic': 'Ocurrió un error al contactar al asistente.',
        'assistant_error_network': 'No se pudo contactar al asistente. Verifica tu conexión e inténtalo de nuevo.',
        'assistant_inserted': '✅ Los datos se insertaron en el formulario.',
        'assistant_insert_failed': 'No se pudo insertar automáticamente. Usa "Descargar .txt" y cárgalo con el botón de esta página.',
        'assistant_greeting_necesidades': '¡Hola! Vamos a identificar juntos las necesidades y prioridades de tu proyecto. Cuéntame, ¿de qué trata tu proyecto o qué proceso quieres mejorar?',
        'assistant_greeting_ideas': '¡Hola! Ayudémonos a generar ideas para tu proyecto. ¿Qué problema específico quieres resolver?',
        'assistant_greeting_evaluacion': '¡Hola! Vamos a evaluar tus ideas frente a tus criterios. ¿Prefieres que revisemos idea por idea, o me das primero tu opinión general?',
        'assistant_greeting_default': '¡Hola! ¿En qué te puedo ayudar?',
        'assistant_mic': 'Dictar por voz',
        'assistant_mic_stop': 'Detener dictado',
        'assistant_listening': 'Escuchando… habla ahora',
        'assistant_voice_unsupported': 'Tu navegador no admite dictado por voz. Usa Chrome o Edge, o escribe tu mensaje.',
        'assistant_voice_denied': 'No se pudo usar el micrófono. Permite el acceso al micrófono en tu navegador (la página debe abrirse con HTTPS).',
        'assistant_voice_no_speech': 'No se escuchó nada. Pulsa el micrófono e inténtalo de nuevo.',
        'assistant_voice_no_mic': 'No se encontró un micrófono. Conecta uno e inténtalo de nuevo.',
        'assistant_voice_network': 'El servicio de voz del navegador no está disponible. Revisa tu conexión.',
        'assistant_voice_error': 'No se pudo iniciar el dictado por voz.',

        // PIE DE PÁGINA
        'footer_text': 'José Luis Rodríguez Téllez — Salvador González García'
    };
})(window.PFM = window.PFM || {});
