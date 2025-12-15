<?php
include "conexion.php";

if ($connection->connect_error) {
    http_response_code(500);
    die("Fallo en la conexión a la base de datos: " . $connection->connect_error);
}

if (isset($_POST['id_eje'])) {

    $id_ejecutivo = (int) $_POST['id_eje'];

   
    $sql_delete = "DELETE FROM ejecutivo WHERE id_eje = $id_ejecutivo";

    if ($connection->query($sql_delete) === TRUE) {

        // 1. Verificar si la tabla 'ejecutivo' quedó vacía
        $sql_count = "SELECT COUNT(*) AS total FROM ejecutivo";
        $result_count = $connection->query($sql_count);
        $row = $result_count->fetch_assoc();

        if ($row['total'] == 0) {
            // 2. Si la tabla está vacía, reiniciamos el contador
            $sql_reset = "ALTER TABLE ejecutivo AUTO_INCREMENT = 1";
            $connection->query($sql_reset);

            echo "Ejecutivo con ID $id_ejecutivo eliminado con éxito. ";
        } else {
            echo "Ejecutivo con ID $id_ejecutivo eliminado con éxito.";
        }

    } else {
        http_response_code(500);
        echo "Error al intentar eliminar el ejecutivo: " . $connection->error;
    }

} else {
    http_response_code(400);
    echo "ID de ejecutivo no proporcionado.";
}

$connection->close();
?>