<?php
include "conexion.php";

if (isset($_POST['id_cit'])) {
    $id_cita = (int) $_POST['id_cit'];

    // CAMBIO CLAVE: En lugar de DELETE, hacemos UPDATE del estatus
    $sql_logic_delete = "UPDATE cita SET eli_cit = 0 WHERE id_cit = $id_cita";

    if ($connection->query($sql_logic_delete) === TRUE) {
        echo "Cita con ID $id_cita marcada como oculta (borrado lógico).";
    } else {
        http_response_code(500);
        echo "Error al intentar ocultar la cita: " . $connection->error;
    }
} else {
    http_response_code(400);
    echo "ID de cita no proporcionado.";
}

$connection->close();
?>