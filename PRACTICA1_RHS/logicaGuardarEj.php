<?php

include "conexion.php"; 

// 2. Verifica si se recibieron los datos POST esperados 
if (isset($_POST['nom_eje']) && isset($_POST['tel_eje'])) {
    

    // 3. Define y ejecuta la consulta SQL para insertar en la tabla 'ejecutivo'
    $sql = "INSERT INTO ejecutivo (nom_eje, tel_eje) VALUES ('$nombre', '$telefono')";

    if ($connection->query($sql) === TRUE) {
        // Éxito: Devuelve el ID insertado al Front-end.
        echo "Ejecutivo registrado con éxito. ID: " . $connection->insert_id;
    } else {
        // Error SQL: Envía una respuesta de error 500 al Front-end.
        http_response_code(500); 
        echo "Error al insertar ejecutivo: " . $connection->error;
    }
    
} else {
    // Error 400: Parámetros incorrectos o faltantes.
    http_response_code(400); 
    echo "Faltan datos necesarios para agregar el ejecutivo.";
}

// 4. Cierra la conexión (buena práctica)
$connection->close();
?>