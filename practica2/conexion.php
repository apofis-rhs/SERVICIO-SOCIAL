<?php
// Conexión a la base de datos
$DB_HOST = 'localhost';
$DB_USER = 'root';
$DB_PASS = '';
$DB_NAME = 'bdpractica';


$connection = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);

// Verificar errores de conexión
if ($connection->connect_errno) {
    die("Error de conexión MySQL: " . $connection->connect_error);
}

// Configurar charset
$connection->set_charset("utf8mb4");
?>