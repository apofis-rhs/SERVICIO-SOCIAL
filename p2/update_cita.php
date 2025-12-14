<?php
include "conexion.php";
if (!isset($_POST['id'], $_POST['nombre'], $_POST['ejecutivo'])) { echo "ERROR: Datos incompletos"; exit; }
$id = intval($_POST['id']); $nombre = trim($_POST['nombre']); $id_eje = intval($_POST['ejecutivo']);
$stmt = mysqli_prepare($connection, "UPDATE cita SET nom_cit = ?, id_eje2 = ? WHERE id_cit = ?");
mysqli_stmt_bind_param($stmt, "sii", $nombre, $id_eje, $id);
if (mysqli_stmt_execute($stmt)) echo "OK"; else echo "ERROR: ".mysqli_stmt_error($stmt);
mysqli_stmt_close($stmt);
?>
