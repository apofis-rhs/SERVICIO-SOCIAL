const container = document.querySelector('#handsometable');
let hotInstance = null;
let isAutosaving = false;
let listaEjecutivosGlobal = []; // <--- CORRECTO


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
                
                // --- TRUCO: BUSCAR EL NOMBRE BASADO EN EL ID ---
                let nombreVisual = "";
                // Buscamos en la lista global el ID que coincida con cita.id_eje2
                let ejecutivoEncontrado = listaEjecutivosGlobal.find(e => e.id == cita.id_eje2);
                if (ejecutivoEncontrado) {
                    nombreVisual = ejecutivoEncontrado.label; // 'Juan Perez'
                }

                agendaData.push({
                    rango_fijo: etiquetaRango,
                    id_cit: cita.id_cit,
                    cit_cit: cita.cit_cit,
                    hor_cit: cita.hor_cit,
                    nom_cit: cita.nom_cit,
                    
                    id_eje2: cita.id_eje2,       // GUARDAMOS EL ID (OCULTO)
                    nom_eje_visual: nombreVisual,// GUARDAMOS EL NOMBRE (VISIBLE)
                    
                    comentarios: cita.comentarios
                });
            });
        } else {
           
            agendaData.push({
                rango_fijo: etiquetaRango,
                id_cit: null,
                cit_cit: fechaHoy,
                hor_cit: horaBase,
                nom_cit: "",
                id_eje2: "",        // ID Vacío
                nom_eje_visual: "", // Nombre Vacío
                comentarios: ""
            });
        }
    }
    return agendaData;
}


// ----------------------------------------------------------------------
// FASE I, PASO 3: initializeHandsontable (CORREGIDA)
// ----------------------------------------------------------------------
function initializeHandsontable(dataCitas, metadata) {
    
    // 1. Preprocesar los datos para la Agenda
    const datosEstructurados = generarEstructuraAgenda(dataCitas);
    
    if (hotInstance) {
        hotInstance.destroy();
    }

    // 2. CONSTRUCCIÓN DINÁMICA: Mapeamos 
    const colHeaders = metadata.map(col => col.header);
    
    const columns = metadata.map(col => {
    
        const colDef = {
            data: col.data,
            type: col.type,
            readOnly: col.readOnly || false,
            className: col.className || 'htLeft'
        };

        
        if (col.dateFormat) colDef.dateFormat = col.dateFormat;
        if (col.timeFormat) colDef.timeFormat = col.timeFormat;

        // --- LÓGICA PARA LA COLUMNA EJECUTIVO ---
        if (col.header === 'EJECUTIVO') { 
            // 1. CAMBIAMOS EL 'DATA' PARA QUE LEA EL NOMBRE VISUAL, NO EL ID
            colDef.data = 'nom_eje_visual'; 
            
            // 2. OBTENEMOS LA LISTA DE NOMBRES PARA EL SELECT
            colDef.source = listaEjecutivosGlobal.map(e => e.label);
            
            colDef.type = 'dropdown';
        }
        
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
        
        
        colHeaders: colHeaders,
        columns: columns,
        
        rowHeaders: true,
        contextMenu: true,
        licenseKey: 'non-commercial-and-evaluation',
        columnSorting: {
            indicator: true,
            sortEmptyCells: true
        },

       
        
        beforeRemoveRow: function (index, amount, physicalRows) {
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

        afterChange: function (changes, source) {
            if (source === 'loadData' || source === 'id_population' || !changes) {
                return;
            }

            changes.forEach(([row, prop, oldValue, newValue]) => {
                if (oldValue === newValue) return;

                const rowData = this.getSourceDataAtRow(row);

                if (rowData.id_cit) {
                    // CASO 1: UPDATE
                    ajaxActualizarCita(rowData);
                } else {
                    // CASO 2: CREATE
                    if (prop !== 'rango_fijo' && rowData.nom_cit && rowData.nom_cit.trim() !== '') {
                        ajaxGuardarCita(rowData, row); 
                    }
                }
            });
        }
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
            if (response && response.data && response.metadata) {
                
                // 1. GUARDAMOS LA LISTA DE EJECUTIVOS QUE VIENE DE TU PHP
                listaEjecutivosGlobal = response.ejecutivos || []; 

                // 2. INICIAMOS LA TABLA
                initializeHandsontable(response.data, response.metadata);
            }
        },
        error: function (xhr, status, error) { console.error("Error:", error); }
    });
}

// ----------------------------------------------------------------------
// Funciones AJAX de CRUD
// ----------------------------------------------------------------------
function prepararDatosParaEnvio(rowData) {
    
    // A. Calculamos el ID del ejecutivo basado en el nombre visual
    let idEjecutivoFinal = null;
    
    // Si hay nombre visual seleccionado, buscamos su ID en la lista global
    if (rowData.nom_eje_visual && rowData.nom_eje_visual.trim() !== "") {
        let e = listaEjecutivosGlobal.find(item => item.label === rowData.nom_eje_visual);
        if (e) {
            idEjecutivoFinal = e.id;
        }
    } else {
        // Si no hay nombre, enviamos null o vacío
        idEjecutivoFinal = ""; 
    }

    // B. Creamos un objeto NUEVO y LIMPIO
    // Solo incluimos lo que la base de datos necesita.
    // ¡IMPORTANTE!: NO incluimos 'rango_fijo' (porque lleva HTML y rompe el servidor)
    // ni 'nom_eje_visual' (porque la BD no tiene esa columna).
    return {
        id_cit:      rowData.id_cit,
        cit_cit:     rowData.cit_cit,
        hor_cit:     rowData.hor_cit,
        nom_cit:     rowData.nom_cit,
        comentarios: rowData.comentarios,
        id_eje2:     idEjecutivoFinal // <--- Aquí va el ID numérico
    };
}

function ajaxEliminarCita(id) {
    console.log("Eliminando ID:", id);
    $.ajax({
        url: 'logicaEliminarCit.php', // Asegúrate de tener este archivo
        type: 'POST',
        data: { id_cit: id },
        success: function(response) { console.log("Eliminado:", response); },
        error: function(xhr) { console.error("Error delete:", xhr.responseText); }
    });
}

function ajaxActualizarCita(rowData) {
    // 1. Usamos la función para limpiar los datos antes de enviar
    const datosLimpios = prepararDatosParaEnvio(rowData);

    console.log("Enviando UPDATE limpio:", datosLimpios);

    $.ajax({
        url: 'logicaActualizarCit.php',
        type: 'POST',
        data: datosLimpios, // <--- Enviamos el objeto limpio
        success: function (response) {
            console.log('Actualización exitosa:', response);
        },
        error: function (xhr, status, error) {
            console.error('Error al actualizar:', xhr.responseText);
        }
    });
}

function ajaxGuardarCita(rowData, visualRowIndex) {
    isAutosaving = true;
    
    // 1. Usamos la función para limpiar los datos antes de enviar
    const datosLimpios = prepararDatosParaEnvio(rowData);

    console.log("Enviando INSERT limpio:", datosLimpios);

    $.ajax({
        url: 'logicaGuardarCit.php',
        type: 'POST',
        data: datosLimpios, // <--- Enviamos el objeto limpio
        success: function (response) {
            // Asumimos que el PHP devuelve el nuevo ID (ej: "15")
            let nuevoID = parseInt(response) || 0;
            
            if (nuevoID > 0) {
                // Actualizamos la celda de ID en la tabla visualmente
                // El índice 1 corresponde a la columna 'id_cit' definida en el metadata
                hotInstance.setDataAtCell(visualRowIndex, 1, nuevoID, 'id_population'); 
                console.log('Creado con ID:', nuevoID);
                
                // Actualizamos también el id interno de la fila para futuros updates
                rowData.id_cit = nuevoID;
            } else {
                console.warn("Se guardó, pero no se recibió un ID válido:", response);
            }
        },
        error: function(xhr) {
             console.error("Error al guardar:", xhr.responseText);
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