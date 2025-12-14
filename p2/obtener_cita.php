<?php
include "conexion.php";
if (!isset($_POST['id'])) { echo json_encode(['error'=>'ID no recibido']); exit; }
$id = intval($_POST['id']);
$stmt = mysqli_prepare($connection, "SELECT id_cit, nom_cit, id_eje2 FROM cita WHERE id_cit = ?");
mysqli_stmt_bind_param($stmt, "i", $id);
mysqli_stmt_execute($stmt);
$res = mysqli_stmt_get_result($stmt);
$data = $res->fetch_assoc();
if ($data) echo json_encode($data); else echo json_encode(['error'=>'No encontrado']);
mysqli_stmt_close($stmt);
?>
