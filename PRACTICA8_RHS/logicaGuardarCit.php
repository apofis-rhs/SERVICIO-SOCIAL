<?php
include "conexion.php";
header('Content-Type: text/plain'); 

if (!isset($connection) || $connection->connect_error) {
    http_response_code(500);
    die("Fallo conexión BD");
}

// Arrays para construir la consulta
$fields = []; // Nombres de las columnas (ej: nom_cit, comentarios)
$values = []; // Valores a insertar (ej: 'Nuevo cliente', NULL)
$ignoredKeys = ['rango_fijo', 'id_cit']; // Campos que Handsontable envía pero no se insertan

// --- 1. CONSTRUCCIÓN DINÁMICA DE CAMPOS Y VALORES ---
foreach ($_POST as $key => $value) {
    
    // Ignorar claves internas de Handsontable o el ID (que aún no existe)
    if (in_array($key, $ignoredKeys)) {
        continue;
    }
    
    // Si la clave es un valor vacío o null, la preparamos como NULL
    if ($value === null || (is_string($value) && trim($value) === '')) {
        // Excepción: Forzamos la inserción de 'NULL' para valores vacíos
        $value_sql = 'NULL'; 
    } else {
        // Sanitizamos y envolvemos en comillas
        $value_sanitized = $connection->real_escape_string($value);
        $value_sql = "'" . $value_sanitized . "'";
    }

    // Agregamos al array
    $fields[] = "`$key`";
    $values[] = $value_sql;
}


// --- 2. CONSULTA SQL DINÁMICA ---
if (empty($fields)) {
     http_response_code(400);
     die("No hay campos válidos para insertar.");
}

$sql = "INSERT INTO cita (" . implode(', ', $fields) . ") VALUES (" . implode(', ', $values) . ")";


// --- 3. EJECUCIÓN ---
if ($connection->query($sql) === TRUE) {
    echo $connection->insert_id;
} else {
    http_response_code(500);
    // Añadimos el SQL para ayudar a depurar si falla la sintaxis
    echo "Error SQL: " . $connection->error . " | Query: " . $sql; 
}

$connection->close();
?>