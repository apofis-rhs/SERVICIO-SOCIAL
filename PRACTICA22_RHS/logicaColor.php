<?php
include "conexion.php";
header('Content-Type: application/json');

if (!isset($_POST['id_cit']) || !isset($_POST['campo'])) {
    echo json_encode(['status' => 'error', 'msg' => 'Datos incompletos']);
    exit;
}

$id_cit = (int)$_POST['id_cit'];
$campo = $connection->real_escape_string($_POST['campo']);
$color = isset($_POST['color']) ? trim($_POST['color']) : '';

// LÓGICA:
// Si color viene vacío o es 'reset', BORRAMOS.
// Si trae un código HEX, INSERTAMOS/ACTUALIZAMOS.

if ($color === '' || $color === 'reset') {
    $sql = "DELETE FROM cita_celdas_estilo WHERE id_cit = $id_cit AND campo = '$campo'";
    $accion = 'borrado';
} else {
    $colSafe = $connection->real_escape_string($color);
    $sql = "INSERT INTO cita_celdas_estilo (id_cit, campo, color, fecha_reg) 
            VALUES ($id_cit, '$campo', '$colSafe', NOW()) 
            ON DUPLICATE KEY UPDATE color = '$colSafe', fecha_reg = NOW()";
    $accion = 'guardado';
}

if ($connection->query($sql)) {
    echo json_encode(['status' => 'ok', 'accion' => $accion]);
} else {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'msg' => $connection->error]);
}

$connection->close();
?>