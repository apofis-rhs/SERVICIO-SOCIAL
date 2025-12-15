<?php
include "conexion.php";
header('Content-Type: application/json');

$response = ['error' => 'ID no proporcionado.'];

if (isset($_GET['id_eje'])) {

    $id_ejecutivo = (int) $_GET['id_eje'];

    if ($connection->connect_error) {
        $response = ['error' => 'Fallo en la conexión a la base de datos.'];
    } else {
        // Consulta para obtener un solo registro
        $sql = "SELECT id_eje, nom_eje, tel_eje FROM ejecutivo WHERE id_eje = $id_ejecutivo";
        $result = $connection->query($sql);

        if ($result && $result->num_rows > 0) {
            // Devuelve el registro como un objeto JSON
            $response = $result->fetch_assoc();
        } else {
            $response = ['error' => 'Ejecutivo no encontrado.'];
        }
        $connection->close();
    }
}

echo json_encode($response);
?>