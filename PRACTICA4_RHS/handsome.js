const container = document.querySelector('#handsometable');
let hotInstance = null;
let isAutosaving = false; // Bandera para evitar bucles infinitos al actualizar ID



function generarEstructuraAgenda(citasBD) {
    const horaInicio = 8;
    const horaFin = 20; // Hasta las 8 PM
    let agendaData = [];

    const fechaHoy = new Date().toISOString().split('T')[0];

    for (let h = horaInicio; h < horaFin; h++) {
      
        let etiquetaRango = `${h.toString().padStart(2, '0')}:00 - ${(h + 1).toString().padStart(2, '0')}:00`;

       
        let horaBase = `${h.toString().padStart(2, '0')}:00:00`;

      
        const citasDelRango = citasBD.filter(c => {
            if (!c.hor_cit) return false;
            let horaCita = parseInt(c.hor_cit.split(':')[0]); // Extrae "10" de "10:34:00"
            return horaCita === h;
        });

       
        if (citasDelRango.length > 0) {
            citasDelRango.forEach(cita => {
                agendaData.push({
                    rango_fijo: etiquetaRango, 
                    id_cit: cita.id_cit,
                    cit_cit: cita.cit_cit,
                    hor_cit: cita.hor_cit,     // Muestra la hora real
                    nom_cit: cita.nom_cit,
                    id_eje2: cita.id_eje2
                });
            });
        } else {
            // 5. Si NO hay citas, creamos el "hueco" vacío para mantener la estructura
            agendaData.push({
                rango_fijo: etiquetaRango, // <--- Dato para la nueva columna
                id_cit: null,              // Es null porque no existe en BD
                cit_cit: fechaHoy,
                hor_cit: horaBase,         // 10:00:00 por defecto
                nom_cit: "",
                id_eje2: ""
            });
        }
    }
    return agendaData;
}


function initializeHandsontable(dataCitas) {
    const datosEstructurados = generarEstructuraAgenda(dataCitas);
    console.log(datosEstructurados);
    if (hotInstance) {
        hotInstance.destroy();
    }

    hotInstance = new Handsontable(container, {
        themeName: 'ht-theme-main',
        data: datosEstructurados,
        colHeaders: ['HORARIO','ID', 'Fecha', 'Hora', 'Nombre Cita/Cliente', 'ID Ejecutivo'],
        columns: [
            { 
                data: 'rango_fijo',
                type: 'text',
                readOnly: true, // NO EDITABLE
                className: 'htCenter htMiddle', // Centrado vertical y horizontal
                width: 120, // Ancho fijo para que se vea bien
                renderer: function (instance, td, row, col, prop, value, cellProperties) {
                    Handsontable.renderers.TextRenderer.apply(this, arguments);
                    td.style.fontWeight = 'bold';
                    td.style.color = '#555';
                    td.style.backgroundColor = '#f0f0f0'; // Fondo grisáceo
                    td.style.borderRight = '2px solid #ccc'; // Borde separador
                }
            },
            { data: 'id_cit', type: 'numeric', readOnly: true },
            { data: 'cit_cit', type: 'date', dateFormat: 'YYYY-MM-DD', correctFormat: true, className: 'htCenter' },
            { data: 'hor_cit', type: 'time', timeFormat: 'HH:mm:ss', correctFormat: true, className: 'htCenter' },
            { data: 'nom_cit', type: 'text' },
            { data: 'id_eje2', type: 'numeric' }
        ],
       
        rowHeaders: true,
        contextMenu: true,
        licenseKey: 'non-commercial-and-evaluation',
        columnSorting: {
            indicator: true, // flechita ↑ ↓
            sortEmptyCells: true


        },

        // ------------------------------------------------------------------
        // LOGICA DE ELIMINAR (DELETE)
        // ------------------------------------------------------------------
        beforeRemoveRow: function (index, amount, physicalRows) {
            // Obtenemos los datos de las filas que se van a borrar
            const idsToDelete = [];

            physicalRows.forEach(rowIndex => {
                // Usamos getSourceDataAtRow para obtener el objeto real de la data
                const rowData = this.getSourceDataAtRow(rowIndex);
                if (rowData && rowData.id_cit) {
                    idsToDelete.push(rowData.id_cit);
                }
            });

            if (idsToDelete.length > 0) {
                // Opcional: Confirmación
                const confirmacion = confirm(`¿Estás seguro de eliminar ${idsToDelete.length} registros?`);
                if (!confirmacion) {
                    return false; // Cancela la eliminación visual en la tabla
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

                // SIEMPRE debería tener ID, porque se creó en afterCreateRow
                if (rowData.id_cit) {
                    console.log(rowData);
                    ajaxActualizarCita(rowData);
                } else {
                    console.error('Error: Se intentó editar una fila sin ID en base de datos.');
                }
            });
        },

        
        afterCreateRow: function (index, amount, source) {
            if (source === 'loadData') return;

            // AJAX para crear registro vacío en PHP
            $.ajax({
                url: 'logicaGuardarCit.php',
                type: 'POST',
                success: function (response) {
                    let nuevoID = parseInt(response);
                    if (!isNaN(nuevoID) && nuevoID > 1) {
                        // Usamos un source especial 'id_population' para que afterChange lo ignore
                        hotInstance.setDataAtCell(index, 1, nuevoID, 'id_population');
                    }
                },
                error: function (xhr) {
                    console.error('Error creando fila vacía:', xhr.responseText);
                }
            });
        }
    });
}



function ajaxEliminarCita(id) {
    $.ajax({
        url: 'logicaEliminarCit.php',
        type: 'POST',
        data: { 'id_cit': id },
        success: function (response) {
            console.log('Eliminado:', response);
        },
        error: function (xhr) {
            alert('Error al eliminar: ' + xhr.responseText);
            cargarCitas(); 
        }
    });
}

function ajaxActualizarCita(rowData) {
    console.log("actualizando cita");
    $.ajax({
        url: 'logicaActualizarCit.php',
        type: 'POST',
        data: {
            id_cit: rowData.id_cit,
            nom_cit: rowData.nom_cit,
            id_eje2: rowData.id_eje2,
            cit_cit: rowData.cit_cit, // Agregamos fecha
            hor_cit: rowData.hor_cit  // Agregamos hora
        },
        success: function (response) {
            console.log('Actualizado:', response);
        },
        error: function (xhr) {
            console.error('Error update:', xhr.responseText);
        }
    });
}

function ajaxGuardarCita(rowData, visualRowIndex) {
    // Evitamos guardar multiples veces si el usuario teclea rápido
    isAutosaving = true;

    $.ajax({
        url: 'logicaGuardarCit.php',
        type: 'POST',
        data: {
            nom_cit: rowData.nom_cit,
            id_eje2: rowData.id_eje2,
            cit_cit: rowData.cit_cit,
            hor_cit: rowData.hor_cit
        },
        success: function (response) {
            
            let nuevoID = parseInt(response) || 1;

            if (nuevoID > 1) {
                // Actualizamos la celda ID en la tabla para que la próxima edición sea un UPDATE
                hotInstance.setDataAtCell(visualRowIndex, 1, nuevoID);
                console.log('Creado con ID:', nuevoID);
            }
        },
        complete: function () {
            isAutosaving = false;
        }
    });
}

function cargarCitas() {
    $.ajax({
        url: 'obtenerCitas.php',
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            initializeHandsontable(data);
        },
        error: function (xhr, status, error) {
            console.error("Error cargar citas: " + error);
        }
    });
}

$(document).ready(function () {
    cargarCitas();
});