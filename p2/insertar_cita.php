<?php
include "conexion.php";
if (!isset($_POST['nombre'], $_POST['ejecutivo'])) { echo "ERROR: Faltan datos"; exit; }
$nombre = trim($_POST['nombre']); $id_eje = intval($_POST['ejecutivo']);
$stmt = mysqli_prepare($connection, "INSERT INTO cita (nom_cit, id_eje2) VALUES (?, ?)");
mysqli_stmt_bind_param($stmt, "si", $nombre, $id_eje);
if (mysqli_stmt_execute($stmt)) echo "OK"; else echo "ERROR: ".mysqli_stmt_error($stmt);
mysqli_stmt_close($stmt);
?>
