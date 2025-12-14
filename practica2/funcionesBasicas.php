<?php
// Funciones reutilizables


// Ejecutar consulta y devolver array de resultados o false
function ejecutarConsulta($query, $connection) {
$result = mysqli_query($connection, $query);
if (!$result) return false;
$datos = [];
while($row = mysqli_fetch_assoc($result)) {
$datos[] = $row;
}
return $datos;
}


// Función para escape de datos (prevención SQL Injection)
function escape($valor, $connection) {
return mysqli_real_escape_string($connection, $valor);
}


// Respuesta exitosa estándar (json)
function respuestaExito($data = null, $message = 'OK') {
return json_encode([
'success' => true,
'data' => $data,
'message' => $message
], JSON_UNESCAPED_UNICODE);
}


// Respuesta de error estándar (json)
function respuestaError($message = 'Error', $code = 400) {
return json_encode([
'success' => false,
'message' => $message,
'code' => $code
], JSON_UNESCAPED_UNICODE);
}


?>