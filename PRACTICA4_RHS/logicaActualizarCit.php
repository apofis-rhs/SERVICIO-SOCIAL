<?php
include "conexion.php";


if ($connection->connect_error) {
    http_response_code(500);
    die("Fallo en la conexión a la base de datos: " . $connection->connect_error);
}

if (isset($_POST['id_cit']) && isset($_POST['nom_cit']) && isset($_POST['id_eje2']) && isset($_POST['cit_cit']) && isset($_POST['hor_cit'])) {

    $id = (int) $_POST['id_cit'];
    $nombre_cita = $connection->real_escape_string($_POST['nom_cit']);
    $id_ejecutivo = (int) $_POST['id_eje2'];

    $fecha_cita = $connection->real_escape_string($_POST['cit_cit']); // Formato esperado YYYY-MM-DD
    $hora_cita = $connection->real_escape_string($_POST['hor_cit']);   // Formato esperado HH:MM:SS

    $sql = "UPDATE cita SET 
                nom_cit = '$nombre_cita', 
                id_eje2 = $id_ejecutivo, 
                cit_cit = '$fecha_cita', 
                hor_cit = '$hora_cita' 
            WHERE id_cit = $id";

    if ($connection->query($sql) === TRUE) {
        echo "Cita con ID $id actualizada con éxito.";
    } else {
        // Error de SQL
        http_response_code(500);
        echo "Error al actualizar cita: " . $connection->error;
    }

} else {
    http_response_code(400);
    echo "Faltan datos necesarios (fecha, hora, nombre o ejecutivo).";
}

$connection->close();
?>