// 1. Define el contenedor de Handsontable
const container = document.querySelector('#handsometable');
let hotInstance = null;
let isAutosaving = false; // Bandera para evitar bucles infinitos al actualizar ID

function initializeHandsontable(dataCitas) {
    if (hotInstance) {
        hotInstance.destroy();
    }

    hotInstance = new Handsontable(container, {
        themeName: 'ht-theme-main',
        data: dataCitas,
        colHeaders: ['ID', 'Fecha', 'Hora', 'Nombre Cita/Cliente', 'ID Ejecutivo'],
        columns: [
            { data: 'id_cit', type: 'numeric', readOnly: true },
            { data: 'cit_cit', type: 'date', dateFormat: 'YYYY-MM-DD', correctFormat: true, className: 'htCenter' },
            { data: 'hor_cit', type: 'time', timeFormat: 'h:mm:ss', correctFormat: true, className: 'htCenter' }, // Ajuste tipo time
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

            // Si hay IDs válidos (no son filas vacías), procedemos al AJAX
            if (idsToDelete.length > 0) {
                
                const confirmacion = confirm(`¿Estás seguro de eliminar ${idsToDelete.length} registros?`);
                if (!confirmacion) {
                    return false; // Cancela la eliminación visual en la tabla
                }

               
                idsToDelete.forEach(id => {
                    ajaxEliminarCita(id);
                });
            }
        },

        // ------------------------------------------------------------------
        // LOGICA DE INSERTAR Y EDITAR (CREATE & UPDATE)
        // ------------------------------------------------------------------
        afterChange: function (changes, source) {
            if (source === 'loadData' || source === 'id_population' || !changes) {
                return;
            }

            changes.forEach(([row, prop, oldValue, newValue]) => {
                if (oldValue === newValue) return;

                const rowData = this.getSourceDataAtRow(row);

                // SIEMPRE debería tener ID, porque se creó en afterCreateRow
                if (rowData.id_cit) {
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
                    if (!isNaN(nuevoID) && nuevoID > 0) {
                        // Usamos un source especial 'id_population' para que afterChange lo ignore
                        hotInstance.setDataAtCell(index, 0, nuevoID, 'id_population');
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
            cargarCitas(); // Recargamos para restaurar la fila si falló el borrado en BD
        }
    });
}

function ajaxActualizarCita(rowData) {
    $.ajax({
        url: 'logicaActualizarCit.php',
        type: 'POST',
        data: {
            id_cit: rowData.id_cit,
            nom_cit: rowData.nom_cit,
            id_eje2: rowData.id_eje2,
            cit_cit: rowData.cit_cit, 
            hor_cit: rowData.hor_cit  
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
           
            let nuevoID = parseInt(response) || 0;

            if (nuevoID > 0) {
                
                hotInstance.setDataAtCell(visualRowIndex, 0, nuevoID);
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