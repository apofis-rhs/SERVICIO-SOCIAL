<?php
include "conexion.php";
if (!isset($_POST['id'])) { echo "ERROR: ID no recibido"; exit; }
$id = intval($_POST['id']);
$stmt = mysqli_prepare($connection, "DELETE FROM cita WHERE id_cit = ?");
mysqli_stmt_bind_param($stmt, "i", $id);
if (mysqli_stmt_execute($stmt)) echo "OK"; else echo "ERROR: ".mysqli_stmt_error($stmt);
mysqli_stmt_close($stmt);
?>
