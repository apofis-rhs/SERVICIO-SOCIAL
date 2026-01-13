<?php
include "conexion.php";
header('Content-Type: text/plain');

if (!isset($connection) || $connection->connect_error) {
    http_response_code(500);
    die("Fallo en la conexión");
}
// se verifica que se haya enviado el ID
if (!isset($_POST['id_cit'])) {
    http_response_code(400);
    die("Falta ID");
}

$id = (int) $_POST['id_cit'];

//aqui se ocupa un ejecutivo aleatorio para simular el usuario que hace el cambio
$resRandom = $connection->query("SELECT nom_eje FROM ejecutivo ORDER BY RAND() LIMIT 1");
$rowRandom = $resRandom->fetch_assoc(); // Primero extraemos la fila
$ejecutivoLog = isset($rowRandom['nom_eje']) ? $rowRandom['nom_eje'] : 'Sistema'; // Luego el dato


// Aqui se obtienen los datos actuales ya que se hacen cambios

$sqlOld = "SELECT * FROM cita WHERE id_cit = $id";
//
$resOld = $connection->query($sqlOld);
$oldData = $resOld->fetch_assoc();
$setClauses = [];
$cambiosDetectados = [];

//  DETECCIÓN DE CAMBIOS 
foreach ($_POST as $key => $value) {
    if ($key === 'id_cit' || $key === 'rango_fijo') continue;

    // Sanitización
    $value_sanitized = ($value === '' || $value === null) ? 'NULL' : "'" . $connection->real_escape_string($value) . "'";
    
    // Comparar con el valor viejo para el LOG
    $valorNuevoStr = ($value === '' || $value === null) ? 'VACÍO' : $value;
    
    // Verificamos si la llave existe en oldData antes de usarla
    $valorViejoOriginal = isset($oldData[$key]) ? $oldData[$key] : null;
    $valorViejoStr = ($valorViejoOriginal === null) ? 'VACÍO' : $valorViejoOriginal;

    if ($valorViejoOriginal != $value) {
        $cambiosDetectados[] = "en '$key' de '$valorViejoStr' por '$valorNuevoStr'";
    }

    $setClauses[] = "`$key` = $value_sanitized";
}

if (empty($setClauses)) {
    echo "No hay cambios."; //si no se hicieron cambios
    exit();
}

// EJECUTAR ACTUALIZACIÓN 
$setStatement = implode(', ', $setClauses);
$sql = "UPDATE cita SET $setStatement WHERE id_cit = $id";

if ($connection->query($sql) === TRUE) {
    
    // REGISTRAR EN HISTORIAL SI HUBO CAMBIOS ---
    if (!empty($cambiosDetectados)) {
        // En PHP 5.6 usamos la variable $ejecutivoLog limpia
        $detalle = "El usuario " . $ejecutivoLog . " hizo un cambio " . implode(", ", $cambiosDetectados);
        
        // Sanitizamos el detalle por si contiene comillas de los valores cambiados
        $detalle_sanitizado = $connection->real_escape_string($detalle);
        
        $sql_log = "INSERT INTO historial_cita (res_his_cit, mov_his_cit, des_his_cit, id_cit11) 
                    VALUES ('$ejecutivoLog', 'cambio', '$detalle_sanitizado', $id)";
        $connection->query($sql_log);
    }

    echo "Cita con ID $id actualizada con éxito.";
} else {
    http_response_code(500);
    echo "Error: " . $connection->error;
}

$connection->close();
?>