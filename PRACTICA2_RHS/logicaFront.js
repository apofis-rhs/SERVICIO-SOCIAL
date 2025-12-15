
function cargarEjecutivos() {
    $.ajax({
        url: 'obtenerEjecutivos.php',
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            var tbody = $('#tabla-ejecutivos tbody');
            tbody.empty();

            if (data.error) {
                console.error("Error del servidor: " + data.error);
                tbody.append('<tr><td colspan="4">Error al cargar datos.</td></tr>');
                return;
            }

            $.each(data, function (index, ejecutivo) {
                var row = `
                    <tr>
                        <td>${ejecutivo.id_eje}</td>
                        <td>${ejecutivo.nom_eje}</td>
                        <td>${ejecutivo.tel_eje}</td>
                        <td>
                            <button 
                                class="btn btn-success btn-sm mr-2" 
                                onclick="mostrarModalEditarEjecutivo(${ejecutivo.id_eje})">
                                Editar
                            </button>
                            <button 
                                class="btn btn-danger btn-sm" 
                                onclick="eliminarEjecutivo(${ejecutivo.id_eje})">
                                Eliminar
                            </button>
                        </td>
                    </tr>
                `;
                tbody.append(row);
            });
        },
        error: function (xhr, status, error) {
            console.error("Fallo en la conexión AJAX para cargar ejecutivos: " + error);
            $('#tabla-ejecutivos tbody').empty().append('<tr><td colspan="4">No se pudieron cargar los ejecutivos.</td></tr>');
        }
    });
}


function cargarCitas() {
    $.ajax({
        url: 'obtenerCitas.php',
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            var tbody = $('#tabla-citas tbody');
            tbody.empty();

            if (data.error) {
                console.error("Error del servidor (citas): " + data.error);
                tbody.append('<tr><td colspan="4">Error al cargar datos.</td></tr>');
                return;
            }

            $.each(data, function (index, cita) {
                var row = `
                    <tr>
                        <td>${cita.id_cit}</td>
                        <td>${cita.nom_cit}</td>
                        <td>${cita.id_eje2}</td>
                        <td>
                            <button
                            class="btn btn-success btn-sm mr-2"
                            onclick="mostrarModalEditarCita(${cita.id_cit})">
                            Editar
                            </button>
                            <button
                                class="btn btn-danger btn-sm"
                                onclick="eliminarCita(${cita.id_cit})">
                                Eliminar
                            </button>
                        </td>
                    </tr>
                `;
                tbody.append(row);
            });
        },
        error: function (xhr, status, error) {
            console.error("Fallo en la conexión AJAX para cargar citas: " + error);
            $('#tabla-citas tbody').empty().append('<tr><td colspan="4">No se pudieron cargar las citas.</td></tr>');
        }
    });
}


/**
 * Muestra el formulario de edición de Ejecutivo.
 */
function mostrarModalEditarEjecutivo(id) {
    // 1. Ocultar todos los modales existentes
    $('#modal-editar-cita').hide(); // Ocultamos el otro modal
    $('#modal-editar-ejecutivo').hide();
    $('#modal-backdrop').hide();

    $.ajax({
        url: 'obtenerEjecutivoPorId.php',
        type: 'GET',
        data: { id_eje: id },
        dataType: 'json',
        success: function (ejecutivo) {
            if (ejecutivo.error) {
                alert('Error al cargar datos de edición: ' + ejecutivo.error);
                return;
            }

            $('#edit_id_eje').val(ejecutivo.id_eje);
            $('#edit_nom_eje').val(ejecutivo.nom_eje);
            $('#edit_tel_eje').val(ejecutivo.tel_eje);

            // 2. Mostrar el modal y el backdrop
            $('#modal-editar-ejecutivo').slideDown();
            $('#modal-backdrop').fadeIn();
        },
        error: function (xhr, status, error) {
            alert('Error al obtener datos para edición: ' + xhr.responseText);
        }
    });
}


/**
 * Muestra el formulario de edición de CITA.
 */
function mostrarModalEditarCita(id) {
    // 1. Ocultar todos los modales existentes
    $('#modal-editar-ejecutivo').hide(); // Ocultamos el otro modal
    $('#modal-editar-cita').hide();
    $('#modal-backdrop').hide();

    $.ajax({
        url: 'obtenerCitaPorId.php',
        type: 'GET',
        data: { id_cit: id },
        dataType: 'json',
        success: function (cita) {
            if (cita.error) {
                alert('Error al cargar datos de edición de cita: ' + cita.error);
                return;
            }

            $('#edit_id_cit').val(cita.id_cit);
            $('#edit_nom_cit').val(cita.nom_cit);
            $('#edit_id_eje2').val(cita.id_eje2);

            // 2. Mostrar el modal y el backdrop
            $('#modal-editar-cita').slideDown();
            $('#modal-backdrop').fadeIn();
        },
        error: function (xhr, status, error) {
            alert('Error al obtener datos para edición de cita: ' + xhr.responseText);
        }
    });
}

function eliminarEjecutivo(id) {
    if (!confirm(`¿Está seguro de que desea eliminar al ejecutivo con ID ${id}?`)) { return; }
    $.ajax({
        url: 'logicaEliminarEj.php',
        type: 'POST',
        data: { 'id_eje': id },
        success: function (response) {
            alert(response);
            cargarEjecutivos();
        },
        error: function (xhr, status, error) {
            alert('Error al eliminar ejecutivo: ' + xhr.responseText);
        }
    });
}


function eliminarCita(id) {
    if (!confirm(`¿Está seguro de que desea eliminar la cita con ID ${id}?`)) { return; }
    $.ajax({
        url: 'logicaEliminarCit.php',
        type: 'POST',
        data: { 'id_cit': id },
        success: function (response) {
            alert(response);
            cargarCitas();
        },
        error: function (xhr, status, error) {
            alert('Error al eliminar cita: ' + xhr.responseText);
        }
    });
}
// =======================================================
// === EVENTOS AL CARGAR EL DOCUMENTO (document.ready) ===
// =======================================================

$(document).ready(function () {
    // 1. Cargar datos al iniciar la página
    cargarEjecutivos();
    cargarCitas();

    // 2. Evento para GUARDAR CAMBIOS DE CITA
    $('#btn-update-cit').click(function () {
        var id = $('#edit_id_cit').val();
        var nombre = $('#edit_nom_cit').val();
        var idEjecutivo = $('#edit_id_eje2').val();
        console.log(id,nombre,idEjecutivo)
        if (nombre === '' || idEjecutivo === '') {
            alert('Por favor, complete todos los campos de la cita.');
            return;
        }

        $.ajax({
            url: 'logicaActualizarCit.php',
            type: 'POST',
            data: {
                id_cit: id,
                nom_cit: nombre,
                id_eje2: idEjecutivo
            },
            success: function (response) {
                alert(response);
                $('#modal-editar-cita').slideUp();
                $('#modal-backdrop').fadeOut();
                cargarCitas();
            },
            error: function (xhr, status, error) {
                alert('Error al actualizar cita: ' + xhr.responseText);
            }
        });
    });

    // 3. Evento para CANCELAR EDICIÓN DE CITA
    $('#btn-cancel-edit-cit').click(function () {
        $('#modal-editar-cita').slideUp();
        $('#modal-backdrop').fadeOut();
    });

    // 4. Evento para GUARDAR CAMBIOS DE EJECUTIVO
    $('#btn-update-eje').click(function () {
        var id = $('#edit_id_eje').val();
        var nombre = $('#edit_nom_eje').val();
        var telefono = $('#edit_tel_eje').val();

        if (nombre === '' || telefono === '') {
            alert('Por favor, complete todos los campos.');
            return;
        }

        $.ajax({
            url: 'logicaActualizarEj.php',
            type: 'POST',
            data: {
                id_eje: id,
                nom_eje: nombre,
                tel_eje: telefono
            },
            success: function (response) {
                alert(response);
                $('#modal-editar-ejecutivo').slideUp();
                $('#modal-backdrop').fadeOut();
                cargarEjecutivos();
            },
            error: function (xhr, status, error) {
                alert('Error al actualizar ejecutivo: ' + xhr.responseText);
            }
        });
    });

    // 5. Evento para CANCELAR EDICIÓN DE EJECUTIVO
    $('#btn-cancel-edit').click(function () {
        $('#modal-editar-ejecutivo').slideUp();
        $('#modal-backdrop').fadeOut();
    });

    // 6. Lógica para guardar ejecutivo (CREAR)
    $('#btn-add-eje').click(function () {
        var nombre = $('#nom_eje').val();
        var telefono = $('#tel_eje').val();

        if (nombre === '' || telefono === '') {
            alert('Por favor, completa todos los campos del ejecutivo.');
            return;
        }

        $.ajax({
            url: 'logicaGuardarEj.php',
            type: 'POST',
            data: {
                nom_eje: nombre,
                tel_eje: telefono
            },
            success: function (response) {
                alert(response);
                cargarEjecutivos();
                $('#nom_eje').val('');
                $('#tel_eje').val('');
            },
            error: function (xhr, status, error) {
                alert('Error al agregar ejecutivo: ' + xhr.responseText);
            }
        });
    });

    // 7. Lógica para guardar cita (CREAR)
    $('#btn-add-cita').click(function () {
        var nombre = $('#nom_cit').val();
        var idEjecutivo = $('#id_eje2').val();

        if (nombre === '' || idEjecutivo === '') {
            alert('Por favor, completa todos los campos de la cita.');
            return;
        }

        $.ajax({
            url: 'logicaGuardarCit.php',
            type: 'POST',
            data: {
                'nom_cit': nombre,
                'id_eje2': idEjecutivo
            },
            success: function (response) {
                alert(response);
                cargarCitas();
                $('#nom_cit').val('');
                $('#id_eje2').val('');
            },
            error: function (xhr, status, error) {
                alert('Error al agendar cita: ' + xhr.responseText);
            }
        });
    });

});