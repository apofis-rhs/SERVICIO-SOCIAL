<?php
include "conexion.php";
header('Content-Type: application/json'); // Indica que la respuesta será JSON

$data = array();

// 1. Verifica la conexión
if ($connection->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'Fallo en la conexión a la base de datos: ' . $connection->connect_error]);
    exit();
}


$sql = "SELECT id_eje, nom_eje, tel_eje FROM ejecutivo ORDER BY id_eje DESC";

// 3. Ejecutar la consulta
$result = $connection->query($sql);

if ($result) {
    // 4. Recorrer los resultados y almacenarlos en un array
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
    // 5. Devolver los datos en formato JSON
    echo json_encode($data);
} else {
   
    http_response_code(500);
    echo json_encode(['error' => 'Error al obtener ejecutivos: ' . $connection->error]);
}


$connection->close();
?>