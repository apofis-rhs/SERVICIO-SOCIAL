<?php
include "conexion.php";
header('Content-Type: application/json');

$response = ['error' => 'ID de cita no proporcionado.'];

if (isset($_GET['id_cit'])) {

    $id_cita = (int) $_GET['id_cit'];

    if ($connection->connect_error) {
        $response = ['error' => 'Fallo en la conexión a la base de datos.'];
    } else {
        // Consulta para obtener la cita
        $sql = "SELECT id_cit, nom_cit, id_eje2 FROM cita WHERE id_cit = $id_cita";
        $result = $connection->query($sql);

        if ($result && $result->num_rows > 0) {
            $response = $result->fetch_assoc();
        } else {
            $response = ['error' => 'Cita no encontrada.'];
        }
        $connection->close();
    }
}

echo json_encode($response);
?>