<?php
include "conexion.php";
header('Content-Type: application/json');

// Validar que lleguen los datos mínimos
if (!isset($_POST['id_cit']) || !isset($_POST['campo'])) {
    echo json_encode(['status' => 'error', 'msg' => 'Datos incompletos']);
    exit;
}

$id_cit = (int)$_POST['id_cit'];
$campo = $connection->real_escape_string($_POST['campo']);
$comentario = isset($_POST['comentario']) ? trim($_POST['comentario']) : '';

// LÓGICA:
// 1. Si el comentario viene vacío, lo borramos de la BD.
// 2. Si trae texto, lo insertamos o actualizamos.

if ($comentario === '') {
    $sql = "DELETE FROM cita_comentarios WHERE id_cit = $id_cit AND campo = '$campo'";
    $accion = 'borrado';
} else {
    $comSafe = $connection->real_escape_string($comentario);
    // ON DUPLICATE KEY UPDATE: Si ya existe nota en esa celda, actualiza el texto; si no, la crea.
    $sql = "INSERT INTO cita_comentarios (id_cit, campo, comentario, fecha_reg) 
            VALUES ($id_cit, '$campo', '$comSafe', NOW()) 
            ON DUPLICATE KEY UPDATE comentario = '$comSafe', fecha_reg = NOW()";
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