<?php
include 'funcionesBasicas.php';
include 'conexion.php';

// Consulta inicial para llenar la tabla al cargar
$query = "
    SELECT c.id_cita, c.nom_cita, e.nom_eje

    
    FROM cita c
    LEFT JOIN ejecutivo e ON c.id_eje2 = e.id_eje
    ORDER BY c.id_cita DESC
";
$citas = ejecutarConsulta($query, $connection);

// Obtener todos los ejecutivos para el select de creación/edición
$query_eje = "SELECT id_eje, nom_eje FROM ejecutivo ORDER BY nom_eje";
$ejecutivos = ejecutarConsulta($query_eje, $connection);
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Citas - CRUD AJAX</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
    <style>
        body { background-color: #f4f7fa; }
        .card-header { background-color: #5d56b0 !important; color: #fff; border-bottom: 3px solid #00bcd4; }
        .table thead.thead-dark th { background-color: #00bcd4; color: #fff; border-color: #00a4b7; }
        .btn-info, .btn-success, .btn-warning, .btn-danger { border-radius: 4px; }
        .container { margin-top: 50px; margin-bottom: 50px; }
        .modal-header { background-color: #5d56b0; color: #fff; }
    </style>
</head>
<body>

<div class="container">
    <div class="card shadow">
        <div class="card-header">
            <h1 class="mb-0">Citas</h1>
        </div>

        <div class="card-body">
            <button class="btn btn-success mb-3" id="btn-crear-cita">Crear Cita</button>

            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead class="thead-dark">
                        <tr>
                            <th>ID</th>
                            <th>Nombre de la Cita</th>
                            <th>Ejecutivo Asignado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="tabla-citas-body">
                        <?php if ($citas): ?>
                            <?php foreach ($citas as $cita): ?>
                            <tr data-id="<?= $cita['id_cita'] ?>">
                                <td><?= htmlspecialchars($cita['id_cita']) ?></td>
                                <td><?= htmlspecialchars($cita['nom_cita']) ?></td>
                                <td><?= htmlspecialchars($cita['nom_eje']) ?></td>
                                <td>
                                    <button class="btn btn-sm btn-info btn-editar">Editar</button>
                                    <button class="btn btn-sm btn-danger btn-eliminar">Eliminar</button>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <tr>
                                <td colspan="4" class="text-center text-muted">No hay citas registradas.</td>
                            </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>

        </div>
    </div>
</div>

<!-- Modal Crear/Editar -->
<div class="modal" tabindex="-1" id="modalCita">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Crear/Editar Cita</h5>
        <button type="button" class="close" data-dismiss="modal">&times;</button>
      </div>
      <div class="modal-body">
        <form id="formCita">
            <input type="hidden" name="id_cita" id="id_cita">
            <div class="form-group">
                <label>Nombre de la Cita</label>
                <input type="text" class="form-control" id="nom_cita" name="nom_cita" required>
            </div>
            <div class="form-group">
                <label>Ejecutivo</label>
                <select class="form-control" id="id_eje2" name="id_eje2" required>
                    <option value="">Selecciona un ejecutivo</option>
                    <?php foreach($ejecutivos as $eje): ?>
                        <option value="<?= $eje['id_eje'] ?>"><?= htmlspecialchars($eje['nom_eje']) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-primary" id="guardar-cita">Guardar</button>
        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancelar</button>
      </div>
    </div>
  </div>
</div>


<script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
<script>
function cargarCitas() {
    $.ajax({
        url: 'controladorCitas.php',
        type: 'POST',
        data: { action: 'obtener_citas' },
        dataType: 'json',
        success: function(res) {
            if(res.success) {
                let html = '';
                if(res.data.length === 0) {
                    html = '<tr><td colspan="4" class="text-center text-muted">No hay citas registradas.</td></tr>';
                } else {
                    res.data.forEach(c => {
                        html += `
                        <tr data-id="${c.id_cita}">
                            <td>${c.id_cita}</td>
                            <td>${c.nom_cita}</td>
                            <td>${c.nom_eje}</td>
                            <td>
                                <button class="btn btn-sm btn-info btn-editar">Editar</button>
                                <button class="btn btn-sm btn-danger btn-eliminar">Eliminar</button>
                            </td>
                        </tr>`;
                    });
                }
                $('#tabla-citas-body').html(html);
            }
        }
    });
}

// Crear o editar cita
$('#guardar-cita').click(function(){
    // Serializa los datos del formulario (esto incluye todos los campos, incluido 'id_cita')
    let data = $('#formCita').serialize();
    
    // Determina la acción (guardar o editar)
    let action = $('#id_cita').val() ? 'editar_cita' : 'guardar_cita';
    
    // Añade la acción a los datos serializados
    data += '&action=' + action;

    console.log("Datos enviados:", data);
    console.log("Acción:", action);
    
    $.ajax({
        url: 'controladorCitas.php',
        type: 'POST',
        data: data,
        dataType: 'json',
        timeout: 10000, // Opcional: Establecer un tiempo límite de 10 segundos
        
        // --- HANDLER DE ÉXITO (Respuesta JSON Válida) ---
        success: function(res){
            console.log("Respuesta del servidor (SUCCESS):", res);
            if(res.success){
                alert('✅ Operación exitosa: ' + res.message);
                $('#modalCita').modal('hide');
                $('#formCita')[0].reset();
                cargarCitas();
            } else {
                // Si PHP devuelve { success: false, message: '...' }
                alert('❌ Error lógico del servidor: ' + res.message);
            }
        },
        
        // --- HANDLER DE ERROR (Conexión, JSON inválido o Timeout) ---
        error: function(jqXHR, textStatus, errorThrown){
            console.error("AJAX Error:", textStatus, errorThrown);
            console.error("Respuesta del Servidor:", jqXHR.responseText);

            if(textStatus === 'parsererror') {
                alert('🚨 ERROR DE JSON: El servidor no devolvió una respuesta en formato JSON válida. Verifique si hay errores PHP.');
            } else if (textStatus === 'timeout') {
                 alert('⏳ La petición excedió el tiempo límite (Timeout).');
            } else {
                 alert('🔴 Error de conexión o servidor (' + textStatus + '). Revisa la consola para detalles del error.');
            }
        },
        
        // --- HANDLER DE COMPLETADO (Se ejecuta siempre al finalizar) ---
        complete: function(jqXHR, textStatus) {
            console.log("Petición AJAX completada con estado:", textStatus);
        }
    });
});

// Abrir modal Crear
$('#btn-crear-cita').click(function(){
    $('#id_cita').val('');
    $('#formCita')[0].reset();
    $('#modalCita').modal('show');
});

// Abrir modal Editar
$(document).on('click', '.btn-editar', function(){
    let tr = $(this).closest('tr');
    let id = tr.data('id');
    let nom_cita = tr.find('td:eq(1)').text();
    let nom_eje = tr.find('td:eq(2)').text();
    let id_eje = $('#id_eje2 option').filter(function(){ return $(this).text() == nom_eje; }).val();

    console.log(id_eje);
    console.log(nom_eje);
    console.log(nom_cita);
    console.log(id);
    $('#id_cita').val(id);
    $('#nom_cita').val(nom_cita);
    $('#id_eje2').val(id_eje);
    $('#modalCita').modal('show');
});

// Eliminar cita
$(document).on('click', '.btn-eliminar', function(){
    if(!confirm('¿Seguro que deseas eliminar esta cita?')) return;
    let tr = $(this).closest('tr');
    let id = tr.data('id');

    $.ajax({
        url: 'controladorCitas.php',
        type: 'POST',
        data: { action: 'eliminar_cita', id_cita: id },
        dataType: 'json',
        success: function(res){
            if(res.success){
                cargarCitas();
            } else {
                alert('Error: ' + res.message);
            }
        }
    });
});

// Cargar inicialmente
$(document).ready(function(){
    cargarCitas();
});
</script>
</body>
</html>   