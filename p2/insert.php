<?php
include "conexion.php";
if (!isset($_POST['nombre'], $_POST['tel'])) { echo "ERROR: Faltan datos"; exit; }
$nombre = trim($_POST['nombre']); $tel = trim($_POST['tel']);
$stmt = mysqli_prepare($connection, "INSERT INTO ejecutivo (nom_eje, tel_eje) VALUES (?, ?)");
mysqli_stmt_bind_param($stmt, "ss", $nombre, $tel);
if (mysqli_stmt_execute($stmt)) echo "OK"; else echo "ERROR: ".mysqli_stmt_error($stmt);
mysqli_stmt_close($stmt);
?>
