const container = document.querySelector('#handsometable');
let hotInstance = null;
let isAutosaving = false;

// ----------------------------------------------------------------------
// FUNCIONES DE ESTRUCTURA Y LÓGICA (Generación de la Agenda)
// ----------------------------------------------------------------------

function generarEstructuraAgenda(citasBD) {
    
    const horaInicio = 8;
    const horaFin = 20;
    let agendaData = [];

    const fechaHoy = new Date().toISOString().split('T')[0];

    for (let h = horaInicio; h < horaFin; h++) {
        let etiquetaRango = `${h.toString().padStart(2, '0')}:00 - ${(h + 1).toString().padStart(2, '0')}:00`;
        let horaBase = `${h.toString().padStart(2, '0')}:00:00`;

        const citasDelRango = citasBD.filter(c => {
            if (!c.hor_cit) return false;
            let horaCita = parseInt(c.hor_cit.split(':')[0]);
            return horaCita === h;
        });

        if (citasDelRango.length > 0) {
            citasDelRango.forEach(cita => {
                agendaData.push({
                    rango_fijo: etiquetaRango,
                    id_cit: cita.id_cit,
                    cit_cit: cita.cit_cit,
                    hor_cit: cita.hor_cit,
                    nom_cit: cita.nom_cit,
                    id_eje2: cita.id_eje2,
                    comentarios: cita.comentarios
                });
            });
        } else {
            // Creamos el "hueco" vacío (CREATE inicial)
            agendaData.push({
                rango_fijo: etiquetaRango,
                id_cit: null, // Clave para detectar el CREATE en afterChange
                cit_cit: fechaHoy,
                hor_cit: horaBase,
                nom_cit: "",
                id_eje2: "",
                comentarios: ""
            });
        }
    }
    return agendaData;
}


// ----------------------------------------------------------------------
// FASE I, PASO 3: initializeHandsontable (Acepta metadata y construye dinámicamente)
// ----------------------------------------------------------------------
// NOTA: Se cambiaron los parámetros para aceptar metadata.
function initializeHandsontable(dataCitas, metadata) {
    
    // 1. Preprocesar los datos para la Agenda
    const datosEstructurados = generarEstructuraAgenda(dataCitas);
    
    if (hotInstance) {
        hotInstance.destroy();
    }
    
    // 2. CONSTRUCCIÓN DINÁMICA: Mapeamos el metadata
    const colHeaders = metadata.map(col => col.header);
    const columns = metadata.map(col => {
        // Hacemos una copia para evitar errores de referencia y simplificamos
        const colDef = {
            data: col.data,
            type: col.type,
            readOnly: col.readOnly || false,
            className: col.className || 'htLeft'
        };

        // Añadimos propiedades específicas si existen en el metadata de PHP
        if (col.dateFormat) colDef.dateFormat = col.dateFormat;
        if (col.timeFormat) colDef.timeFormat = col.timeFormat;
        
        
        // Aplicamos el Renderer especial a la columna 'rango_fijo'
        if (col.data === 'rango_fijo') {
            colDef.renderer = function (instance, td, row, col, prop, value, cellProperties) {
                Handsontable.renderers.TextRenderer.apply(this, arguments);
                td.style.fontWeight = 'bold';
                td.style.color = '#555';
                td.style.backgroundColor = '#f0f0f0';
                td.style.borderRight = '2px solid #ccc';
            };
            colDef.width = 120;
        }

        return colDef;
    });

    // 3. Inicialización de Handsontable
    hotInstance = new Handsontable(container, {
        themeName: 'ht-theme-main',
        data: datosEstructurados,
        
        // ¡USAMOS LAS DEFINICIONES DINÁMICAS!
        colHeaders: colHeaders,
        columns: columns,
        
        rowHeaders: true,
        contextMenu: true,
        licenseKey: 'non-commercial-and-evaluation',
        columnSorting: {
            indicator: true,
            sortEmptyCells: true
        },

        // ------------------------------------------------------------------
        // CONTINUACIÓN DE LA LÓGICA CRUD...
        // ------------------------------------------------------------------
        
        beforeRemoveRow: function (index, amount, physicalRows) {
            // ... (Tu lógica de DELETE permanece igual, usa id_cit) ...
            const idsToDelete = [];
            physicalRows.forEach(rowIndex => {
                const rowData = this.getSourceDataAtRow(rowIndex);
                if (rowData && rowData.id_cit) {
                    idsToDelete.push(rowData.id_cit);
                }
            });

            if (idsToDelete.length > 0) {
                const confirmacion = confirm(`¿Estás seguro de eliminar ${idsToDelete.length} registros?`);
                if (!confirmacion) {
                    return false;
                }
                idsToDelete.forEach(id => {
                    ajaxEliminarCita(id);
                });
            }
        },

        // ------------------------------------------------------------------
        // FASE II, PASO 4: afterChange (Lógica CREATE vs UPDATE)
        // ------------------------------------------------------------------
        afterChange: function (changes, source) {
            if (source === 'loadData' || source === 'id_population' || !changes) {
                return;
            }

            changes.forEach(([row, prop, oldValue, newValue]) => {
                // prop es el nombre de la columna (ej: nom_cit)
                if (oldValue === newValue) return;

                const rowData = this.getSourceDataAtRow(row);

                // --- DECISIÓN CRUCIAL ---
                if (rowData.id_cit) {
                    // CASO 1: UPDATE (El hueco ya fue llenado y tiene ID)
                    ajaxActualizarCita(rowData);
                } else {
                    // CASO 2: CREATE (El usuario acaba de llenar un hueco vacío)
                    // Solo guardamos si el cambio es en un campo de datos (no el rango fijo)
                    if (prop !== 'rango_fijo' && rowData.nom_cit && rowData.nom_cit.trim() !== '') {
                        ajaxGuardarCita(rowData, row); 
                    }
                }
            });
        },
        
        // ------------------------------------------------------------------
        // FASE II, PASO 5: Eliminar Lógica de CREACIÓN de fila (ya no aplica)
        // ------------------------------------------------------------------
        // Eliminamos afterCreateRow por completo (No se usa con la Agenda estructurada)
    });
}


// ----------------------------------------------------------------------
// FASE I, PASO 2: cargarCitas (Recibe la respuesta unificada)
// ----------------------------------------------------------------------
function cargarCitas() {
    $.ajax({
        url: 'obtenerCitas.php',
        type: 'GET',
        dataType: 'json',
        success: function (response) {
            // response AHORA ES {data: [...], metadata: [...]}
            if (response && response.data && response.metadata) {
                // Pasamos los dos arrays a la función de inicialización
                initializeHandsontable(response.data, response.metadata);
            } else {
                console.error("Error: Respuesta del servidor no contiene metadata ni data.");
            }
        },
        error: function (xhr, status, error) {
            console.error("Error cargar citas: " + error);
        }
    });
}

// ----------------------------------------------------------------------
// Funciones AJAX de CRUD (Debemos simplificar para que sean dinámicas)
// ----------------------------------------------------------------------

function ajaxEliminarCita(id) {
    // ... (Permanece igual, solo envía el ID) ...
    $.ajax({ /* ... */ });
}

function ajaxActualizarCita(rowData) {
    // FASE III (Próxima): Simplificamos el envío de datos.
    console.log("Actualizando cita:", rowData);
    $.ajax({
        url: 'logicaActualizarCit.php',
        type: 'POST',
        // --- ENVÍO DINÁMICO: Mandamos el objeto de la fila completo. ---
        data: rowData,
        // ...
        success: function (response) {
            console.log('Actualizado:', response);
        },
        error: function (xhr) {
            console.error('Error update:', xhr.responseText);
        }
    });
}

function ajaxGuardarCita(rowData, visualRowIndex) {
    isAutosaving = true;
    
    console.log("Creando nueva cita:", rowData);
    $.ajax({
        url: 'logicaGuardarCit.php',
        type: 'POST',
        // --- ENVÍO DINÁMICO: Mandamos el objeto de la fila completo. ---
        data: rowData,
        // ...
        success: function (response) {
            let nuevoID = parseInt(response) || 1;

            if (nuevoID > 1) {
                // La columna ID es la columna 1 (después de 'HORARIO')
                hotInstance.setDataAtCell(visualRowIndex, 1, nuevoID, 'id_population');
                console.log('Creado con ID:', nuevoID);
            }
        },
        complete: function () {
            isAutosaving = false;
        }
    });
}

// Inicialización
$(document).ready(function () {
    cargarCitas();
});