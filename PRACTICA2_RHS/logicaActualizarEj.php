<?php
include "conexion.php";

if ($connection->connect_error) {
    http_response_code(500);
    die("Fallo en la conexión a la base de datos: " . $connection->connect_error);
}

// 1. Verificar si se recibieron todos los datos necesarios
if (isset($_POST['id_eje']) && isset($_POST['nom_eje']) && isset($_POST['tel_eje'])) {

    // 2. Limpiar y sanitizar datos
    $id = (int) $_POST['id_eje'];
    $nombre = $connection->real_escape_string($_POST['nom_eje']);
    $telefono = $connection->real_escape_string($_POST['tel_eje']);

    // 3. Consulta SQL para actualizar (UPDATE)
    $sql = "UPDATE ejecutivo SET nom_eje = '$nombre', tel_eje = '$telefono' WHERE id_eje = $id";

    if ($connection->query($sql) === TRUE) {
        // Éxito:
        echo "Ejecutivo con ID $id actualizado con éxito.";
    } else {
        // Error en la consulta
        http_response_code(500);
        echo "Error al actualizar ejecutivo: " . $connection->error;
    }

} else {
    
    http_response_code(400);
    echo "Faltan datos necesarios para la actualización.";
}

$connection->close();
?>