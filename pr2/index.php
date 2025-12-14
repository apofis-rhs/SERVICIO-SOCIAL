<?php include "conexion.php"; ?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>CRUD AJAX Ejecutivos & Citas</title>

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
</head>

<body class="p-4">

<div class="container">

    <h2>Agregar Ejecutivo</h2>
    <form id="formEje" class="mb-4">
        <input type="text" name="nombre_eje" placeholder="Nombre" class="form-control mb-2" required>
        <input type="text" name="tel" placeholder="Teléfono" class="form-control mb-2" required>

        <button class="btn btn-secondary rounded">Guardar Ejecutivo</button>
    </form>


    <h2>Agregar Cita</h2>
    <form id="formCita" class="mb-4">

        <input type="text" name="nombre_cita" placeholder="Nombre de la cita" class="form-control mb-2" required>

        <select name="ejecutivo" id="selectEje" class="form-control mb-2" required>
            <option value="">Seleccione un ejecutivo...</option>

            <?php
            $exe = $connection->query("SELECT * FROM ejecutivo");
            while ($fila = $exe->fetch_assoc()) {
                echo "<option value='".$fila['id_eje']."'>".$fila['nom_eje']."</option>";
            }
            ?>
        </select>

        <button class="btn btn-secondary rounded">Guardar Cita</button>
    </form>


    <h2>Listado de Citas</h2>

    <table class="table table-bordered table-striped">
        <thead class="thead-dark">
            <tr>
                <th>ID Cita</th>
                <th>Nombre Cita</th>
                <th>Ejecutivo</th>
                <th>Teléfono</th>
                <th>Acción</th>
            </tr>
        </thead>

        <tbody id="tablaCitas"></tbody>
    </table>

</div>


<!-- ================== MODAL EDITAR CITA ================== -->
<div class="modal fade" id="modalEditar" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">

      <div class="modal-header bg-dark text-white">
        <h5 class="modal-title">Editar Cita</h5>
        <button type="button" class="close text-white" data-dismiss="modal">&times;</button>
      </div>

      <div class="modal-body">

        <input type="hidden" id="edit_id">

        <label>Nombre de la cita</label>
        <input type="text" id="edit_nombre_cita" class="form-control mb-3">

        <label>Ejecutivo</label>
        <select id="edit_ejecutivo" class="form-control">
            <?php
            $exe2 = $connection->query("SELECT * FROM ejecutivo");
            while ($fila2 = $exe2->fetch_assoc()) {
                echo "<option value='".$fila2['id_eje']."'>".$fila2['nom_eje']."</option>";
            }
            ?>
        </select>

      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" data-dismiss="modal">Cancelar</button>
        <button id="btnGuardarCambios" class="btn btn-primary">Guardar cambios</button>
      </div>

    </div>
  </div>
</div>



<!-- ================== SCRIPTS AJAX ================== -->
<script>

// Cargar citas al iniciar
cargarTabla();

// ----------------------
//    AGREGAR EJECUTIVO
// ----------------------
$("#formEje").submit(function(e){
    e.preventDefault();

    $.post("api.php", {
        accion: "add_eje",
        nombre_eje: $("[name='nombre_eje']", this).val(),
        tel: $("[name='tel']", this).val()
    }, function(res){
        alert("Ejecutivo agregado");
        location.reload();
    });
});


// ----------------------
//     AGREGAR CITA
// ----------------------
$("#formCita").submit(function(e){
    e.preventDefault();

    $.post("api.php", {
        accion: "add_cita",
        nombre_cita: $("[name='nombre_cita']", this).val(),
        ejecutivo: $("#selectEje").val()
    }, function(res){
        alert("Cita agregada");
        cargarTabla();
        $("#formCita")[0].reset();
    });
});


// ----------------------
//     CARGAR TABLA
// ----------------------
function cargarTabla(){
    $.post("api.php", {accion:"listar"}, function(data){

        let info = JSON.parse(data);
        let html = "";

        info.forEach(c => {
            html += `
                <tr>
                    <td>${c.id_cit}</td>
                    <td>${c.nom_cit}</td>
                    <td>${c.nom_eje}</td>
                    <td>${c.tel_eje}</td>
                    <td>
                        <button class='btn btn-primary btn-sm' onclick='editar(${c.id_cit})'>Editar</button>
                        <button class='btn btn-danger btn-sm' onclick='borrar(${c.id_cit})'>Eliminar</button>
                    </td>
                </tr>
            `;
        });

        $("#tablaCitas").html(html);

    });
}


// ----------------------
//     ELIMINAR CITA
// ----------------------
function borrar(id){
    if (!confirm("¿Eliminar cita?")) return;

    $.post("api.php", {accion:"del_cita", id:id}, function(){
        cargarTabla();
    });
}


// ----------------------
//     EDITAR CITA
// ----------------------
function editar(id){
    $.post("api.php", {accion: "get_cita", id: id}, function(data){
        let cita = JSON.parse(data);

        $("#edit_id").val(cita.id_cit);
        $("#edit_nombre_cita").val(cita.nom_cit);
        $("#edit_ejecutivo").val(cita.id_eje2);

        $("#modalEditar").modal("show");
    });
}


// ----------------------
// GUARDAR CAMBIOS
// ----------------------
$("#btnGuardarCambios").click(function(){

    let id = $("#edit_id").val();
    let nombre_cita = $("#edit_nombre_cita").val();
    let ejecutivo = $("#edit_ejecutivo").val();

    $.post("api.php", {
        accion: "edit_cita",
        id: id,
        nombre_cita: nombre_cita,
        ejecutivo: ejecutivo
    }, function(respuesta){

        if (respuesta.trim() === "ok") {
            alert("Cita actualizada correctamente");
            $("#modalEditar").modal("hide");
            cargarTabla();
        } else {
            alert("Error: " + respuesta);
        }
    });
});

</script>

<!-- Bootstrap JS -->
<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>

</body>
</html>
