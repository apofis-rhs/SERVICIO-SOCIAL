<?php
include "conexion.php";

$nombre = $_POST['nombre'];
$tel = $_POST['tel'];

$sql = "INSERT INTO ejecutivo (nom_eje, tel_eje) VALUES ('$nombre', '$tel')";
$connection->query($sql);

// Alert + regresar
echo "<script>
        alert('Ejecutivo guardado correctamente');
        window.location='index.php';
      </script>";
?>