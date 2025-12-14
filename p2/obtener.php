<?php
include "conexion.php";
if (!isset($_POST['id'])) { echo json_encode(['error'=>'ID no recibido']); exit; }
$id = intval($_POST['id']);
$stmt = mysqli_prepare($connection, "SELECT id_eje, nom_eje, tel_eje FROM ejecutivo WHERE id_eje = ?");
mysqli_stmt_bind_param($stmt, "i", $id);
mysqli_stmt_execute($stmt);
$res = mysqli_stmt_get_result($stmt);
$data = $res->fetch_assoc();
if ($data) echo json_encode($data); else echo json_encode(['error'=>'No encontrado']);
mysqli_stmt_close($stmt);
?>
