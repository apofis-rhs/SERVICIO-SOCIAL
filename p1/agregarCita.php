<?php
include "conexion.php";

$nombre = $_POST['nombre'];
$ejecutivo = $_POST['ejecutivo'];

$sql = "INSERT INTO cita (nom_cit, id_eje2) VALUES ('$nombre', '$ejecutivo')";
$connection->query($sql);

// Alert + regresar
echo "<script>
        alert('Cita guardada correctamente');
        window.location='index.php';
      </script>";
?>
