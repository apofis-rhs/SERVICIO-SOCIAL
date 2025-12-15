<?php
include "conexion.php";

// Verificación básica de conexión
if (!isset($connection) || $connection->connect_error) {
    http_response_code(500);
    die("Fallo conexión BD");
}


$sql = "INSERT INTO cita (nom_cit, id_eje2, cit_cit, hor_cit) VALUES (NULL, NULL, NULL, NULL)";

if ($connection->query($sql) === TRUE) {
    // Retornamos SOLAMENTE el ID generado
    echo $connection->insert_id;
} else {
    http_response_code(500);
    echo "Error SQL: " . $connection->error;
}

$connection->close();
?>