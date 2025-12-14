$(document).ready(function() {
    // 1. Asocia el evento 'click' al botón de guardar ejecutivo
    $('#btn-add-eje').click(function() {
        
        var nombre = $('#nom_eje').val();
        var telefono = $('#tel_eje').val();

        // Validación básica (puedes agregar más)
        if (nombre === '' || telefono === '') {
            alert('Por favor, completa todos los campos del ejecutivo.');
            return; // Detiene la función si falta un campo
        }

        // 3. Envía los datos al servidor usando AJAX (jQuery)
        $.ajax({
            url: 'logicaGuardarEj.php', // El archivo PHP que recibirá y guardará los datos
            type: 'POST', // Método de envío
            data: { 
                nom_eje: nombre, 
                tel_eje: telefono 
            },
            success: function(response) {
                
                alert('Ejecutivo agregado con éxito: ' + response);
                
                // Limpia los campos del formulario
                $('#nom_eje').val('');
                $('#tel_eje').val('');
                 
            },
            error: function(xhr, status, error) {
                alert('Error al agregar ejecutivo: ' + error);
            }
        });
    });

    $('#btn-add-cita').click(function() {
        
        var nombre = $('#nom_cita').val();
        var idEjecutivo = $('#id_eje2').val();

        //Validación básica (puedes agregar más)
        if (nombre === '' || idEjecutivo=== '') {
            alert('Por favor, completa todos los campos del ejecutivo.');
            return; // Detiene la función si falta un campo
        }

        // 3. Envía los datos al servidor usando AJAX (jQuery)
        $.ajax({
            url: 'logicaGuardarCit.php', // El archivo PHP que recibirá y guardará los datos
            type: 'POST', // Método de envío
            data: { 
                nom_cit: nombre, 
                id_eje2: idEjecutivo
            },
            success: function(response) {
                
                alert('Cita agregado con éxito: ' + response);
                
                // Limpia los campos del formulario
                $('#nom_cit').val('');
                $('#id_eje2').val('');
                 
            },
            error: function(xhr, status, error) {
                alert('Error al agregar ejecutivo: ' + error);
            }


         });
    });

});