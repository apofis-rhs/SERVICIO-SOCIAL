<?php
include "conexion.php";
header('Content-Type: application/json; charset=utf-8');

// 1. Validar que recibimos el ID del ejecutivo
if (!isset($_GET['id_eje'])) {
    echo json_encode([]);
    exit;
}

$idEje = (int)$_GET['id_eje'];

// 2. Consulta a la tabla nueva
// Ordenamos DESC para ver lo más reciente arriba
$sql = "SELECT 
            fec_his_eje, 
            res_his_eje, 
            mov_his_eje, 
            des_his_eje 
        FROM historial_ejecutivo 
        WHERE id_eje11 = $idEje 
        ORDER BY fec_his_eje DESC";

$result = $connection->query($sql);

$historial = array();

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $historial[] = $row;
    }
}

// 3. Devolver JSON
echo json_encode($historial);

$connection->close();
?>