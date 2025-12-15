<?php

include "conexion.php";

if (!isset($connection) || $connection->connect_error) {
    http_response_code(500);
    die("Fallo en la conexión a la base de datos: " . $connection->connect_error);
}

if (isset($_POST['nom_eje']) && isset($_POST['tel_eje'])) {

    $nombre = $connection->real_escape_string($_POST['nom_eje']);
    $telefono = $connection->real_escape_string($_POST['tel_eje']);

    $sql = "INSERT INTO ejecutivo (nom_eje, tel_eje) VALUES ('$nombre', '$telefono')";

    if ($connection->query($sql) === TRUE) {
        
            
            echo "Ejecutivo agregado con éxito: \nID: " . $connection->insert_id;
         
    } else {
        http_response_code(500);
        echo "Error al insertar ejecutivo: " . $connection->error;
    }

} else {
    
    http_response_code(400);
    echo "Faltan datos necesarios para agregar el ejecutivo.";
}

$connection->close();
?>