<?php
include "conexion.php";
header('Content-Type: application/json');

$ejecutivos = [];
$resEje = $connection->query("SELECT id_eje, nom_eje FROM ejecutivo ORDER BY nom_eje ASC");
if ($resEje) {
    while($e = $resEje->fetch_assoc()){
        $ejecutivos[] = [
            'id' => $e['id_eje'],
            'label' => $e['nom_eje']
        ];
    }
}

$metadata = [
    [
        'header' => 'HORARIO',
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
        'header' => 'EJECUTIVO',
        'data' => 'id_eje2',    // Guardaremos en el campo de ID
        'type' => 'dropdown',   // O 'autocomplete'
        'source' => array_column($ejecutivos, 'label'), // Handsontable recibe solo nombres: ['Juan', 'Ana']
        'sourceFull' => $ejecutivos // Guardamos la lista completa para usarla en JS: [{id:1, label:'Juan'}...]
    ],
    [
        'header' => 'Comentarios',
        'data' => 'comentarios',
        'type' => 'text' 
    ]
];

// --- 2. OBTENCIÓN DE DATOS ---
$data = array();

if ($connection->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'Fallo en la conexión: ' . $connection->connect_error]);
    exit();
}

$sql = "SELECT id_cit, nom_cit, id_eje2, cit_cit, hor_cit, comentarios FROM cita ORDER BY id_cit DESC";
$result = $connection->query($sql);

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Error al obtener citas: ' . $connection->error]);
    $connection->close();
    exit();
}

// --- 3. RESPUESTA UNIFICADA ---
$response = [
    'metadata' => $metadata,
    'data' => $data, // <-- AQUÍ FALTABA LA COMMA
    'ejecutivos' => $ejecutivos
];

echo json_encode($response);
$connection->close();
?>