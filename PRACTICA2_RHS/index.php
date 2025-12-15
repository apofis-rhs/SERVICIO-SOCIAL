<?php include "conexion.php"; ?>
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <title>CRUD AJAX Ejecutivos & Citas</title>

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
</head>

<body id="body">
    <div id="modal-backdrop"
        style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); z-index: 999; display: none;">
    </div>
    <div id="modal-editar-ejecutivo" class="container mt-5 mb-5 p-4 border rounded"
        style="display:none; background-color: #f8f9fa; position:absolute; z-index:1000; left:21%;">
        <h3> Editar Ejecutivo</h3>

        <input type="hidden" id="edit_id_eje">

        <div class="form-row">
            <div class="col-md-4 mb-2">
                <label for="edit_nom_eje">Nombre Completo:</label>
                <input type="text" id="edit_nom_eje" class="form-control" required>
            </div>
            <div class="col-md-3 mb-2">
                <label for="edit_tel_eje">Teléfono:</label>
                <input type="tel" id="edit_tel_eje" class="form-control" required>
            </div>
            <div class="col-md-3 mb-2 d-flex align-items-end">
                <button id="btn-update-eje" class="btn btn-success mr-2">Guardar Cambios</button>
                <button id="btn-cancel-edit" class="btn btn-secondary">Cancelar</button>
            </div>
        </div>
    </div>

    <div id="modal-editar-cita" class="container mt-5 mb-5 p-4 border rounded"
        style="display:none; background-color: #fff; position:absolute; z-index:1000; left:21%;">
        <h3> Editar Cita</h3>

        <input type="hidden" id="edit_id_cit">

        <div class="form-row">
            <div class="col-md-5 mb-2">
                <label for="edit_nom_cit">Nombre de la Cita/Cliente:</label>
                <input type="text" id="edit_nom_cit" class="form-control" required>
            </div>
            <div class="col-md-3 mb-2">
                <label for="edit_id_eje2">ID del Ejecutivo:</label>
                <input type="text" id="edit_id_eje2" class="form-control" required>
            </div>
            <div class="col-md-3 mb-2 d-flex align-items-end">
                <button id="btn-update-cit" class="btn btn-success mr-2">Guardar Cambios</button>
                <button id="btn-cancel-edit-cit" class="btn btn-secondary">Cancelar</button>
            </div>
        </div>
    </div>

    <div class="container mt-4">
        <h1>Practica 1: Crear MYSQL, Primera Parte</h1>

        <div class="mb-5">
            <h2 class="mt-4">Gestión de Ejecutivos</h2>
            <h3 class="h5">Añadir Nuevo Ejecutivo</h3>

            <div class="form-row align-items-end mb-3">
                <div class="col-md-4 mb-2">
                    <label for="nom_eje">Nombre Completo:</label>
                    <input type="text" id="nom_eje" name="nom_eje" class="form-control" placeholder="Nombre Completo"
                        required>
                </div>
                <div class="col-md-3 mb-2">
                    <label for="tel_eje">Teléfono:</label>
                    <input type="tel" id="tel_eje" name="tel_eje" class="form-control" placeholder="Teléfono" required>
                </div>
                <div class="col-md-2 mb-2">
                    <button id="btn-add-eje" class="btn btn-secondary w-100">Guardar</button>
                </div>
            </div>

            <table id="tabla-ejecutivos" class="table table-bordered table-striped">
                <thead>
                    <tr>
                        <th>ID Ejecutivo</th>
                        <th>Nombre Ejecutivo</th>
                        <th>Teléfono</th>
                        <th>Acciones</th>

                    </tr>
                </thead>
                <tbody>
                </tbody>
            </table>
        </div>

        <div class="mb-5">
            <h2 class="mt-4">Gestión de Citas</h2>
            <h3 class="h5">Añadir Nueva Cita</h3>

            <div class="form-row align-items-end mb-3">
                <div class="col-md-4 mb-2">
                    <label for="nom_cit">Nombre de la Cita/Cliente:</label>
                    <input type="text" id="nom_cit" name="nom_cit" class="form-control"
                        placeholder="Nombre Cliente/Cita" required>
                </div>
                <div class="col-md-3 mb-2">
                    <label for="id_eje2">ID del Ejecutivo:</label>
                    <input type="text" id="id_eje2" name="id_eje2" class="form-control" placeholder="ID del Ejecutivo"
                        required>
                </div>
                <div class="col-md-2 mb-2">
                    <button id="btn-add-cita" class="btn btn-secondary  w-100">Agendar Cita</button>
                </div>
            </div>

            <table id="tabla-citas" class="table table-bordered table-striped">
                <thead>
                    <tr>
                        <th>ID Cita</th>
                        <th>Nombre Cita</th>
                        <th>ID Ejecutivo</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
            </table>
        </div>

    </div>
    </div>

    <script src="logicaFront.js"></script>

</body>

</html>