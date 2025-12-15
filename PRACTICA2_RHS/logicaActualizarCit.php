<?php
include "conexion.php";

// 1. Verifica la conexión
if ($connection->connect_error) {
    http_response_code(500);
    
    die("Fallo en la conexión a la base de datos: " . $connection->connect_error);
}

// 2. Verificar datos POST
if (isset($_POST['id_cit']) && isset($_POST['nom_cit']) && isset($_POST['id_eje2'])) {

    // Limpiar y sanitizar datos
    $id = (int) $_POST['id_cit'];
    $nombre_cita = $connection->real_escape_string($_POST['nom_cit']);
    $id_ejecutivo = (int) $_POST['id_eje2'];

    // 3. Consulta SQL para actualizar (UPDATE)
    $sql = "UPDATE cita SET nom_cit = '$nombre_cita', id_eje2 = $id_ejecutivo WHERE id_cit = $id";

    if ($connection->query($sql) === TRUE) {
        // Éxito
        echo "Cita con ID $id actualizada con éxito.";
    } else {
        // Error de SQL (ej: ID de ejecutivo (FK) no existe)
        http_response_code(500);
        echo "Error al actualizar cita: " . $connection->error;
    }

} else {
    
    http_response_code(400);
    echo "Faltan datos necesarios para la actualización de la cita.";
}

$connection->close();
?>