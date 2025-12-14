<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>crud</title>

    <!-- Bootstrap 4.5 -->
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">

    <!-- jQuery -->
    <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>

</head>
<body class="bg-light">

<div class="container mt-4">

    <h2 class="text-center mb-4">CRUD </h2>

    <!-- FORMULARIO AGREGAR CITA -->
<div class="card mb-4">
  <div class="card-header bg-dark text-white">Agregar Cita</div>
  <div class="card-body">
    <form id="formCita">
      <input type="text" name="nombre" id="cita_nombre" class="form-control mb-2" placeholder="Nombre de la cita" required>

      <select name="ejecutivo" id="cita_ejecutivo" class="form-control mb-2" required>
        <option value="">Seleccione un ejecutivo...</option>
        <?php
        include "conexion.php";
        $exe = $connection->query("SELECT id_eje, nom_eje FROM ejecutivo ORDER BY nom_eje");
        while ($f = $exe->fetch_assoc()) {
            echo "<option value='{$f['id_eje']}'>".htmlspecialchars($f['nom_eje'],ENT_QUOTES,'UTF-8')."</option>";
        }
        ?>
      </select>

      <button type="submit" class="btn btn-secondary rounded-pill">Guardar Cita</button>
    </form>
  </div>
</div>

<!-- TABLA CITAS -->
<div class="card mb-4">
  <div class="card-header bg-dark text-white">Listado de Citas</div>
  <div class="card-body">
    <table class="table table-bordered table-hover text-center">
      <thead>
        <tr class="table-secondary">
          <th>ID</th><th>Nombre Cita</th><th>Ejecutivo</th><th>Teléfono</th><th>Acciones</th>
        </tr>
      </thead>
      <tbody id="tablaCitas">
      </tbody>
    </table>
  </div>
</div>

<!-- FORMULARIO EJECUTIVO -->
<div class="card mb-4">
  <div class="card-header bg-dark text-white">Agregar Ejecutivo</div>
  <div class="card-body">
    <form id="formAgregar">
      <input type="text" name="nombre" class="form-control mb-2" placeholder="Nombre" required>
      <input type="text" name="tel" class="form-control mb-2" placeholder="Teléfono" required>
      <button class="btn btn-secondary rounded-pill">Guardar</button>
    </form>
  </div>
</div>

<!-- TABLA EJECUTIVOS -->
<div class="card mb-4">
  <div class="card-header bg-dark text-white">Listado de Ejecutivos</div>
  <div class="card-body">
    <table class="table table-bordered table-hover text-center">
      <thead>
        <tr class="table-secondary">
          <th>ID</th><th>Nombre</th><th>Teléfono</th><th>Acciones</th>
        </tr>
      </thead>
      <tbody id="tablaDatos"></tbody>
    </table>
  </div>
</div>



    <!-- MODAL EDITAR -->
    <div class="modal fade" id="modalEditar" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">

                <div class="modal-header">
                    <h5 class="modal-title">Editar Ejecutivo</h5>
                    <button type="button" class="close" data-dismiss="modal">
                        <span>&times;</span>
                    </button>
                </div>

                <div class="modal-body">
                    <form id="formEditar">

                        <input type="hidden" id="edit_id">

                        <label>Nombre</label>
                        <input type="text" id="edit_nombre" class="form-control mb-2">

                        <label>Teléfono</label>
                        <input type="text" id="edit_tel" class="form-control">

                    </form>
                </div>

                <div class="modal-footer">
                    <button class="btn btn-secondary" data-dismiss="modal">Cancelar</button>
                    <button class="btn btn-primary" id="btnActualizar">Actualizar</button>
                </div>

            </div>
        </div>
    </div>

</div>

<!-- Bootstrap JS -->
<script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.1/dist/umd/popper.min.js"></script>
<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>

<!-- Archivo JS principal -->
<script src="main.js"></script>

</body>
</html>
