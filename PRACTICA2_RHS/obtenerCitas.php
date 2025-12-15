<?php
include "conexion.php";
header('Content-Type: application/json'); 

$data = array();


if ($connection->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'Fallo en la conexión a la base de datos: ' . $connection->connect_error]);
    exit();
}


$sql = "SELECT id_cit, nom_cit, id_eje2 FROM cita ORDER BY id_cit DESC";


$result = $connection->query($sql);

if ($result) {
    // 4. Recorrer los resultados y almacenarlos en un array
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
 
    echo json_encode($data);
} else {
    // 6. Manejo de error de consulta
    http_response_code(500);
    echo json_encode(['error' => 'Error al obtener citas: ' . $connection->error]);
}


$connection->close();
?>