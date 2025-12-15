/**
 * Función para cargar y renderizar los ejecutivos en la tabla.
 */
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
                tbody.append('<tr><td colspan="3">Error al cargar datos.</td></tr>');
                return;
            }

            $.each(data, function (index, ejecutivo) {
                var row = `
                    <tr>
                        <td>${ejecutivo.id_eje}</td>
                        <td>${ejecutivo.nom_eje}</td>
                        <td>${ejecutivo.tel_eje}</td>
                    </tr>
                `;
                tbody.append(row);
            });
        },
        error: function (xhr, status, error) {
            console.error("Fallo en la conexión AJAX para cargar ejecutivos: " + error);
            $('#tabla-ejecutivos tbody').empty().append('<tr><td colspan="3">No se pudieron cargar los ejecutivos.</td></tr>');
        }
    });
}

function cargarCitas() {
    $.ajax({
        url: 'obtenerCitas.php', // <--- Nuevo archivo
        type: 'GET',
        dataType: 'json',
        success: function (data) {
            var tbody = $('#tabla-citas tbody');
            tbody.empty(); // Limpiar la tabla

            if (data.error) {
                console.error("Error del servidor (citas): " + data.error);
                tbody.append('<tr><td colspan="3">Error al cargar datos.</td></tr>');
                return;
            }

            // Recorrer el array de citas y crear una fila
            $.each(data, function (index, cita) {
                var row = `
                    <tr>
                        <td>${cita.id_cit}</td>
                        <td>${cita.nom_cit}</td>
                        <td>${cita.id_eje2}</td>
                    </tr>
                `;
                tbody.append(row);
            });
        },
        error: function (xhr, status, error) {
            console.error("Fallo en la conexión AJAX para cargar citas: " + error);
            $('#tabla-citas tbody').empty().append('<tr><td colspan="3">No se pudieron cargar las citas.</td></tr>');
        }
    });
}


$(document).ready(function () {

    // 1. Cargar datos al iniciar la página
    cargarEjecutivos();
    cargarCitas(); // <--- LLAMADA INICIAL PARA CITAS

    // 2. Lógica para guardar ejecutivo
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

                // Recargar la tabla de ejecutivos
                cargarEjecutivos();

                $('#nom_eje').val('');
                $('#tel_eje').val('');

            },
            error: function (xhr, status, error) {
                alert('Error al agregar ejecutivo: ' + xhr.responseText);
            }
        });
    });

    // 3. Lógica para guardar cita
    $('#btn-add-cita').click(function () {

        var nombre = $('#nom_cit').val();
        var idEjecutivo = $('#id_eje2').val();

        if (nombre === '' || idEjecutivo === '') {
            // Mensaje corregido
            alert('Por favor, completa todos los campos de la cita.');
            return;
        }

        $.ajax({
            url: 'logicaGuardarCit.php',
            type: 'POST',
            data: {
                'nom_cit': nombre, // Usamos comillas explícitas para asegurar la clave
                'id_eje2': idEjecutivo
            },
        // ...
            success: function (response) {

                alert(response);

                // <--- LLAMADA PARA REFRESCAR LA TABLA DE CITAS
                cargarCitas();

                $('#nom_cit').val('');
                $('#id_eje2').val('');

            },
            error: function (xhr, status, error) {
                // Mensaje de error para citas
                alert('Error al agendar cita: ' + xhr.responseText);
            }
        });
    });

});