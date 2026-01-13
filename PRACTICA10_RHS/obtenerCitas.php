<?php
include "conexion.php";
header('Content-Type: application/json');

// --- 1. OBTENCIÓN DE EJECUTIVOS PARA EL DROPDOWN ---
$ejecutivos = [];
$resEje = $connection->query("SELECT id_eje, nom_eje FROM ejecutivo ORDER BY nom_eje ASC");

$nombresParaDropdown = []; // Variable auxiliar para PHP 5.6

if ($resEje) {
    while($e = $resEje->fetch_assoc()){
        $ejecutivos[] = [
            'id' => $e['id_eje'],
            'label' => $e['nom_eje']
        ];
        // Llenamos el array de nombres manualmente
        $nombresParaDropdown[] = $e['nom_eje'];
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
        'header' => 'Nombre Cita',
        'data' => 'nom_cit',
        'type' => 'text'
    ],
    [
        'header' => 'EJECUTIVO',
        'data' => 'id_eje2',
        'type' => 'dropdown',
        'source' => $nombresParaDropdown, // <--- CAMBIO: Usamos la variable limpia
        'sourceFull' => $ejecutivos 
    ],
    [ 
      'header' => 'Tel. Ejecutivo', 
      'data' => 'tel_eje', 
      'type' => 'text', 
      'readOnly' => true
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
    echo json_encode(array('error' => 'Fallo en la conexión: ' . $connection->connect_error));
    exit();
}

$sql = "SELECT 
            c.id_cit, 
            c.nom_cit, 
            c.id_eje2, 
            c.cit_cit, 
            c.hor_cit, 
            c.comentarios,
            e.tel_eje AS tel_eje  
        FROM cita c
        LEFT JOIN ejecutivo e ON c.id_eje2 = e.id_eje
        WHERE c.eli_cit = 1
        ORDER BY c.id_cit DESC";

$result = $connection->query($sql);

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $data[] = $row; 
    }
} else {
    http_response_code(500);
    echo json_encode(array('error' => 'Error al obtener citas: ' . $connection->error));
    $connection->close();
    exit();
}

// --- 3. RESPUESTA UNIFICADA ---
$response = array(
    'metadata' => $metadata,
    'data' => $data,
    'ejecutivos' => $ejecutivos
);

echo json_encode($response);
$connection->close();
?>