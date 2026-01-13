<?php
include "conexion.php";
header('Content-Type: application/json');

// =======================================================================
// 1. FUNCIÓN RECURSIVA: EL CEREBRO DE LA JERARQUÍA 🧠
// =======================================================================
function obtenerSubordinados($conexion, $idPadre) {
    $ids = array();
    // Buscamos a los hijos directos que estén activos
    $sql = "SELECT id_eje FROM ejecutivo WHERE id_padre = $idPadre AND eli_eje = 1";
    $res = $conexion->query($sql);
    
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $hijoID = $row['id_eje'];
            $ids[] = $hijoID; // Agregamos al hijo a la lista
            
            // ¡RECURSIVIDAD! La función se llama a sí misma para buscar a los "nietos"
            $nietos = obtenerSubordinados($conexion, $hijoID);
            
            // Fusionamos los nietos encontrados con la lista actual
            $ids = array_merge($ids, $nietos);
        }
    }
    return $ids;
}

// =======================================================================
// 2. OBTENCIÓN DE EJECUTIVOS PARA EL DROPDOWN (Handsontable) 📋
// =======================================================================
$ejecutivos = [];
$nombresParaDropdown = [];

// Traemos todos los ejecutivos para llenar el selector de la tabla
$resEje = $connection->query("SELECT id_eje, nom_eje, tel_eje FROM ejecutivo WHERE eli_eje = 1 ORDER BY nom_eje ASC");

if ($resEje) {
    while($e = $resEje->fetch_assoc()){
        $ejecutivos[] = [
            'id' => $e['id_eje'],
            'label' => $e['nom_eje'],
            'tel' => $e['tel_eje'] // <--- ¡AQUÍ ESTÁ LA CLAVE! Guardamos el teléfono
        ];
        $nombresParaDropdown[] = $e['nom_eje'];
    }
}

// =======================================================================
// 3. CONFIGURACIÓN DE METADATA (Columnas de la tabla) ⚙️
// =======================================================================
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
        'source' => $nombresParaDropdown, 
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

// =======================================================================
// 4. LÓGICA DE FILTRADO INTELIGENTE 🕵️‍♂️
// =======================================================================
$whereClause = "WHERE c.eli_cit = 1"; // Filtro base: Solo citas activas

// ¿Nos enviaron un ID desde el árbol?
if (isset($_GET['id_eje']) && $_GET['id_eje'] != '') {
    $idSel = $_GET['id_eje'];
    $modo = isset($_GET['modo']) ? $_GET['modo'] : 'individual';

    // CASO A: SELECCIONARON UN PLANTEL (ID empieza con 'P', ej: "P2")
    if (strpos($idSel, 'P') === 0) {
        $idPlantel = str_replace('P', '', $idSel); // Quitamos la P para obtener el número
        $idPlantel = (int)$idPlantel;
        
        // Filtramos: Trae citas de ejecutivos que pertenezcan a este plantel
        $whereClause .= " AND e.id_pla1 = $idPlantel"; 
    } 
    // CASO B: SELECCIONARON UN EJECUTIVO (ID numérico, ej: "10")
    else {
        $idSel = (int)$idSel;
        
        if ($modo == 'arbol') {
            // 🌳 MODO ÁRBOL: El ejecutivo + todos sus descendientes
            
            // 1. Buscamos a toda la descendencia usando la función recursiva
            $todosLosIDs = obtenerSubordinados($connection, $idSel);
            
            // 2. Agregamos al jefe seleccionado a la lista
            $todosLosIDs[] = $idSel; 
            
            // 3. Convertimos el array a texto para SQL: "10,11,12"
            $listaIDs = implode(",", $todosLosIDs);
            
            // 4. Aplicamos el filtro IN
            $whereClause .= " AND c.id_eje2 IN ($listaIDs)";
            
        } else {
            // 👤 MODO INDIVIDUAL: Solo citas directas de esta persona
            $whereClause .= " AND c.id_eje2 = $idSel";
        }
    }
}

// =======================================================================
// 5. CONSULTA PRINCIPAL A BASE DE DATOS 🗄️
// =======================================================================
$data = array();

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
        $whereClause 
        ORDER BY c.id_cit DESC";

$result = $connection->query($sql);

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $data[] = $row; 
    }
} else {
    // Si falla, enviamos error 500
    http_response_code(500);
    echo json_encode(array('error' => 'Error SQL: ' . $connection->error));
    exit();
}

// =======================================================================
// 6. RESPUESTA FINAL JSON 
// =======================================================================
$response = array(
    'metadata' => $metadata,
    'data' => $data,
    'ejecutivos' => $ejecutivos
);

echo json_encode($response);
$connection->close();
?>