<?php

include "conexion.php";

if (!isset($connection) || $connection->connect_error) {
    http_response_code(500);
    die("Fallo en la conexión a la base de datos: " . $connection->connect_error);
}

if (isset($_POST['nom_cit']) && isset($_POST['id_eje2'])) {

    $nombre_cita = $connection->real_escape_string($_POST['nom_cit']);
    $id_ejecutivo = (int) $_POST['id_eje2'];

    $sql = "INSERT INTO cita (nom_cit, id_eje2) VALUES ('$nombre_cita', $id_ejecutivo)";

    if ($connection->query($sql) === TRUE) {
        echo "Cita agregada con éxito:\nID de Cita: " . $connection->insert_id . "\nEjecutivo asociado: " . $id_ejecutivo;
    } else {
        http_response_code(500);
        echo "Error al insertar cita: " . $connection->error;
    }

} else {
    // Error 400: Parámetros incorrectos o faltantes.
    http_response_code(400);
    echo "Faltan datos necesarios para agregar la cita.";
}

$connection->close();
?>