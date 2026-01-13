<?php
include "conexion.php";
header('Content-Type: text/plain'); 

if (!isset($connection) || $connection->connect_error) {
    http_response_code(500);
    die("Fallo conexión BD");
}

// --- 1. SIMULACIÓN DE RESPONSABLE (CORREGIDO PARA PHP 5.6) ---
$resRandom = $connection->query("SELECT nom_eje FROM ejecutivo ORDER BY RAND() LIMIT 1");
$rowRandom = $resRandom->fetch_assoc(); // Separamos la obtención de la fila
$ejecutivoLog = isset($rowRandom['nom_eje']) ? $rowRandom['nom_eje'] : 'Sistema'; // Usamos ternario en vez de ??

$fields = []; 
$values = []; 
$ignoredKeys = ['rango_fijo', 'id_cit']; 

foreach ($_POST as $key => $value) {
    if (in_array($key, $ignoredKeys)) {
        continue;
    }
    
    if ($value === null || (is_string($value) && trim($value) === '')) {
        $value_sql = 'NULL'; 
    } else {
        $value_sanitized = $connection->real_escape_string($value);
        $value_sql = "'" . $value_sanitized . "'";
    }

    $fields[] = "`$key`";
    $values[] = $value_sql;
}

if (empty($fields)) {
     http_response_code(400);
     die("No hay campos válidos para insertar.");
}

// 2. INSERTAR LA CITA PRIMERO
$sql = "INSERT INTO cita (" . implode(', ', $fields) . ") VALUES (" . implode(', ', $values) . ")";

if ($connection->query($sql) === TRUE) {
    $nuevoIdCita = $connection->insert_id; 

    // --- 3. REGISTRO EN EL HISTORIAL (LOG) ---
    // Corregimos el acceso a $_POST con un ternario para evitar errores en versiones viejas
    $nombreCita = isset($_POST['nom_cit']) ? $_POST['nom_cit'] : 'Nueva Cita';
    $descripcion = "El usuario " . $ejecutivoLog . " dio de alta la cita '" . $nombreCita . "' con ID " . $nuevoIdCita . ".";
    
    // Sanitizamos la descripción para evitar que comillas simples rompan el SQL
    $desc_sanitizada = $connection->real_escape_string($descripcion);

    $sql_log = "INSERT INTO historial_cita (res_his_cit, mov_his_cit, des_his_cit, id_cit11) 
                VALUES ('$ejecutivoLog', 'alta', '$desc_sanitizada', $nuevoIdCita)";
    
    $connection->query($sql_log);
    // ---------------------------------------------

    echo $nuevoIdCita; 
} else {
    http_response_code(500);
    echo "Error SQL: " . $connection->error; 
}

$connection->close();
?>