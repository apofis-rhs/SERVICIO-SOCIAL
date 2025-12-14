<?php
include "conexion.php";
if (!isset($_POST['id'], $_POST['nombre'], $_POST['tel'])) { echo "ERROR: Datos incompletos"; exit; }
$id = intval($_POST['id']); $nombre = trim($_POST['nombre']); $tel = trim($_POST['tel']);
$stmt = mysqli_prepare($connection, "UPDATE ejecutivo SET nom_eje = ?, tel_eje = ? WHERE id_eje = ?");
mysqli_stmt_bind_param($stmt, "ssi", $nombre, $tel, $id);
if (mysqli_stmt_execute($stmt)) echo "OK"; else echo "ERROR: ".mysqli_stmt_error($stmt);
mysqli_stmt_close($stmt);
?>
