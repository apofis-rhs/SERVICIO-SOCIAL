<?php
include "conexion.php";

if ($connection->connect_error) {
    http_response_code(500);
    die("Fallo en la conexión a la base de datos: " . $connection->connect_error);
}

if (isset($_POST['id_cit'])) {

    $id_cita = (int) $_POST['id_cit'];

    $sql_delete = "DELETE FROM cita WHERE id_cit = $id_cita";

    if ($connection->query($sql_delete) === TRUE) {

        // 1. Verificar si la tabla 'cita' quedó vacía
        $sql_count = "SELECT COUNT(*) AS total FROM cita";
        $result_count = $connection->query($sql_count);
        $row = $result_count->fetch_assoc();

        if ($row['total'] == 0) {
            // 2. Si la tabla está vacía, reiniciamos el contador
            $sql_reset = "ALTER TABLE cita AUTO_INCREMENT = 1";
            $connection->query($sql_reset);

            echo "Cita con ID $id_cita eliminada con éxito.";
        } else {
            echo "Cita con ID $id_cita eliminada con éxito.";
        }

    } else {
        http_response_code(500);
        echo "Error al intentar eliminar la cita: " . $connection->error;
    }

} else {
    http_response_code(400);
    echo "ID de cita no proporcionado.";
}

$connection->close();
?>