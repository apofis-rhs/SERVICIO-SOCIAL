<?php include "conexion.php"; ?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Práctica Ejecutivos y Citas</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
</head>
<body class="p-4">

<div class="container">

    <h2>Agregar Ejecutivo</h2>
    <form action="agregarEjecutivo.php" method="POST" class="mb-4">
        <input type="text" name="nombre" placeholder="Nombre" class="form-control mb-2" required>
        <input type="text" name="tel" placeholder="Teléfono" class="form-control mb-2" required>
        <button class="btn btn-secondary rounded">Guardar Ejecutivo</button>
    </form>


    <h2>Agregar Cita</h2>
    <form action="agregarCita.php" method="POST" class="mb-4">

        <input type="text" name="nombre" placeholder="Nombre de la cita" class="form-control mb-2" required>

        <select name="ejecutivo" class="form-control mb-2" required>
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
                <th>Teléfono Ejecutivo</th>
            </tr>
        </thead>

        <tbody>
            <?php
            $sql = "SELECT c.id_cit, c.nom_cit, e.nom_eje, e.tel_eje
                    FROM cita c
                    INNER JOIN ejecutivo e ON c.id_eje2 = e.id_eje";

            $res = $connection->query($sql);

            while ($row = $res->fetch_assoc()) {
                echo "
                <tr>
                    <td>{$row['id_cit']}</td>
                    <td>{$row['nom_cit']}</td>
                    <td>{$row['nom_eje']}</td>
                    <td>{$row['tel_eje']}</td>
                </tr>
                ";
            }
            ?>
        </tbody>
    </table>

</div>

</body>
</html>
