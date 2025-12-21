<?php
include "conexion.php";
header('Content-Type: text/plain');

// 1. Verificación básica de conexión
if (!isset($connection) || $connection->connect_error) {
    http_response_code(500);
    die("Fallo en la conexión a la base de datos: " . $connection->connect_error);
}

// 2. Verificación MÍNIMA: Necesitamos el ID para saber qué actualizar.
if (!isset($_POST['id_cit'])) {
    http_response_code(400);
    die("Faltan datos: Se requiere el ID de la cita para actualizar.");
}

$id = (int) $_POST['id_cit'];
$setClauses = []; // Array para guardar las cláusulas SET (ej: nom_cit = 'Nuevo Nombre')

// --- 3. CONSTRUCCIÓN DINÁMICA DE LA CONSULTA ---
// ... dentro de logicaActualizarCit.php

// --- 3. CONSTRUCCIÓN DINÁMICA DE LA CONSULTA ---
foreach ($_POST as $key => $value) {
    
    // 3.1. Ignorar el campo 'id_cit' y 'rango_fijo'
    if ($key === 'id_cit' || $key === 'rango_fijo') {
        continue;
    }
    
    // 3.2. Sanitización y formateo: Preparar el valor para la consulta
    
    if ($value === null || (is_string($value) && trim($value) === '')) {
        // Si el valor es estrictamente NULL o un string vacío (incluyendo espacios),
        // y el campo de BD DEBE aceptar NULLs (ej. id_eje2 si no es obligatorio)
        // Para cadenas de texto como 'comentarios', preferimos la cadena vacía
        
        // Excepción: Solo forzar NULL si el campo es numérico/ID y está vacío
        if ($key === 'id_eje2') {
             $value_sql = 'NULL'; 
        } else {
             // Para campos de texto como 'comentarios', guardar una cadena vacía si es vacía
             $value_sql = "''"; 
        }
        
    } else {
        // Valor normal (texto, número, fecha)
        $value_sanitized = $connection->real_escape_string($value);
        
        // Rodear el valor con comillas para SQL
        $value_sql = "'" . $value_sanitized . "'";
    }

    // 3.3. Crear la cláusula SET: nombre_campo = 'valor_sanitizado'
    $setClauses[] = "`$key` = $value_sql";
}

// ... (El resto del script de actualización es igual)

// 4. Verificar si se encontraron cláusulas para actualizar
if (empty($setClauses)) {
    http_response_code(200); // OK, pero no se hizo nada (solo se envió el ID)
    echo "No hay campos para actualizar además del ID.";
    $connection->close();
    exit();
}

// 5. Unir las cláusulas SET
$setStatement = implode(', ', $setClauses);

// 6. Ejecutar la consulta SQL dinámica
$sql = "UPDATE cita SET 
            $setStatement 
        WHERE id_cit = $id";

if ($connection->query($sql) === TRUE) {
    // Éxito: No devolvemos el ID, ya lo tenemos en el Front-end
    echo "Cita con ID $id actualizada con éxito.";
} else {
    // Error de SQL (ej: valor no válido para una columna)
    http_response_code(500);
    echo "Error al actualizar cita: " . $connection->error . " | SQL: " . $sql;
}

$connection->close();
?>