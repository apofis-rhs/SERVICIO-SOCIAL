<?php
include "conexion.php";
header('Content-Type: application/json');

// --- 1. DEFINICIÓN DEL METADATA (ESTRUCTURA DINÁMICA) ---
// Este array define el orden y la configuración de cada columna de Handsontable
$metadata = [
    [
        'header' => 'HORARIO',         // Columna fija para la Agenda (la nueva)
        'data' => 'rango_fijo',
        'type' => 'text',
        'readOnly' => true
    ],
    [
        'header' => 'ID',
        'data' => 'id_cit',
        'type' => 'numeric',
        'readOnly' => true
    ],
    [
        'header' => 'Fecha',
        'data' => 'cit_cit',
        'type' => 'date',
        'dateFormat' => 'YYYY-MM-DD',
        'className' => 'htCenter'
    ],
    [
        'header' => 'Hora',
        'data' => 'hor_cit',
        'type' => 'time',
        'timeFormat' => 'HH:mm:ss',
        'className' => 'htCenter'
    ],
    [
        'header' => 'Nombre Cita/Cliente',
        'data' => 'nom_cit',
        'type' => 'text'
    ],
    [
        'header' => 'ID Ejecutivo',
        'data' => 'id_eje2',
        'type' => 'numeric'
    ],

    [
        'header' => 'Comentarios',
        'data' => 'comentarios',
        'type' => 'text' 
    ]

   
];


// --- 2. OBTENCIÓN DE DATOS (NO SE MODIFICA) ---
$data = array();

if ($connection->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'Fallo en la conexión a la base de datos: ' . $connection->connect_error]);
    exit();
}

// Asegúrate de que tu SELECT incluya todos los campos que necesitas
$sql = "SELECT id_cit, nom_cit, id_eje2, cit_cit, hor_cit, comentarios FROM cita ORDER BY id_cit DESC";
$result = $connection->query($sql);

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
} else {
    // Manejo de error de consulta
    http_response_code(500);
    echo json_encode(['error' => 'Error al obtener citas: ' . $connection->error]);
    $connection->close();
    exit();
}

// --- 3. RESPUESTA UNIFICADA ---
// Devolvemos el objeto que contiene tanto la metadata como los datos
$response = [
    'metadata' => $metadata,
    'data' => $data
];

echo json_encode($response);
$connection->close();
?>