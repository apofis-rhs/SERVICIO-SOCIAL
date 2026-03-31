<?php
include "conexion.php";

if(isset($_POST['id_cit'])) {
    $idCit = intval($_POST['id_cit']);
    
    // Cambiamos el estatus lógico de 0 (Eliminada) a 1 (Activa)
    $sql = "UPDATE cita SET eli_cit = 1 WHERE id_cit = $idCit";
    
    // Ejecutamos la consulta
    $resultado = $connection->query($sql);
    
    if($resultado === TRUE) {
        // Le pedimos a MySQL que nos diga si realmente modificó algo
        $filasAfectadas = $connection->affected_rows;
        echo json_encode([
            'status' => 'success', 
            'message' => 'Consulta ejecutada', 
            'filas_modificadas' => $filasAfectadas,
            'sql_intentado' => $sql
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'status' => 'error', 
            'message' => 'Error de MySQL', 
            'error_real' => $connection->error,
            'sql_intentado' => $sql
        ]);
    }
} else {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Falta el ID desde el JS']);
}

$connection->close();
?>