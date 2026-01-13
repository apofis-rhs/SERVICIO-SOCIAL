<?php
include "conexion.php";
header('Content-Type: application/json');

// 1. Validar el ID (Usando array() en lugar de [] para máxima compatibilidad)
if (!isset($_GET['id_cit'])) {
    http_response_code(400);
    echo json_encode(array('error' => 'ID de cita no proporcionado'));
    exit;
}

$id = (int)$_GET['id_cit'];

// 2. Consulta SQL
$sql = "SELECT fec_his_cit, res_his_cit, mov_his_cit, des_his_cit 
        FROM historial_cita 
        WHERE id_cit11 = $id 
        ORDER BY fec_his_cit DESC";

$result = $connection->query($sql);
$historial = array(); // Inicialización compatible

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $historial[] = $row;
    }
    // 3. Respuesta JSON
    echo json_encode($historial);
} else {
    http_response_code(500);
    echo json_encode(array('error' => 'Error al consultar historial: ' . $connection->error));
}

$connection->close();
?>