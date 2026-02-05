<?php
include "conexion.php";
header('Content-Type: application/json');


function obtenerSubordinados($conexion, $idPadre) {
    $ids = array();
    
    $hijosDirectos = array();
    
    $sql = "SELECT id_eje FROM ejecutivo WHERE id_padre = $idPadre AND eli_eje = 1";
    $res = $conexion->query($sql);
    
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $hijosDirectos[] = $row['id_eje'];
        }
        $res->free(); // 
    }

    foreach ($hijosDirectos as $hijoID) {
        // Agregamos al hijo actual
        $ids[] = $hijoID;
        
        // Buscamos a los nietos (Recursividad)
        $nietos = obtenerSubordinados($conexion, $hijoID);
        
        // Fusionamos los nietos a la lista principal
        $ids = array_merge($ids, $nietos);
    }

    return $ids;
}

$ejecutivos = [];
$nombresParaDropdown = [];
$resEje = $connection->query("SELECT id_eje, nom_eje, tel_eje FROM ejecutivo WHERE eli_eje = 1 ORDER BY nom_eje ASC");
if ($resEje) {
    while($e = $resEje->fetch_assoc()){
        $ejecutivos[] = ['id' => $e['id_eje'], 'label' => $e['nom_eje'], 'tel' => $e['tel_eje']];
        $nombresParaDropdown[] = $e['nom_eje'];
    }
}

$metadata = [
    ['header' => 'HORARIO', 'data' => 'rango_fijo', 'type' => 'text', 'readOnly' => true],
    ['header' => 'ID', 'data' => 'id_cit', 'type' => 'numeric', 'readOnly' => true],
    ['header' => 'Fecha', 'data' => 'cit_cit', 'type' => 'date', 'dateFormat' => 'YYYY-MM-DD', 'className' => 'htCenter'],
    ['header' => 'Hora', 'data' => 'hor_cit', 'type' => 'time', 'timeFormat' => 'HH:mm:ss', 'className' => 'htCenter'],
    ['header' => 'Nombre Cita', 'data' => 'nom_cit', 'type' => 'text'],
    ['header' => 'EJECUTIVO', 'data' => 'id_eje2', 'type' => 'dropdown', 'source' => $nombresParaDropdown, 'sourceFull' => $ejecutivos],
    ['header' => 'Tel. Ejecutivo', 'data' => 'tel_eje', 'type' => 'text', 'readOnly' => true],
    ['header' => 'Comentarios', 'data' => 'comentarios', 'type' => 'text']
];



$whereClause = "WHERE c.eli_cit = 1"; 

// A. FILTRO DE FECHAS
if (isset($_GET['inicio']) && isset($_GET['fin']) && $_GET['inicio'] != '' && $_GET['fin'] != '') {
    $inicio = $_GET['inicio'];
    $fin = $_GET['fin'];
    $whereClause .= " AND c.cit_cit BETWEEN '$inicio' AND '$fin'";
}

$idRaw = isset($_GET['id_eje']) ? $_GET['id_eje'] : '';

if ($idRaw === 'null' || $idRaw === 'undefined' || trim($idRaw) === '') {
    $idRaw = ''; 
}

// LÓGICA: Si $idRaw está vacío, BLOQUEAMOS TODO.
if ($idRaw === '') {
    
    
    $whereClause .= " AND 1 = 0";

} else {
  
    
    $modo = isset($_GET['modo']) ? $_GET['modo'] : 'individual';

    // CASO 1: ES UN PLANTEL (Empieza con 'P', ej: "P1")
    if (strpos($idRaw, 'P') === 0) {
        $idPlantel = (int)str_replace('P', '', $idRaw);
        $whereClause .= " AND e.id_pla1 = $idPlantel";
    }
    else {
        $idSel = (int)$idRaw;

        // Modo Permisos (Cubos)
        if (strpos($modo, 'permiso_') === 0) {
            $idDestino = (int)str_replace('permiso_', '', $modo);
            $whereClause .= " AND e.id_pla1 = $idDestino";
        }
        // Modo Árbol
        else if ($modo == 'arbol') {
            $subordinados = obtenerSubordinados($connection, $idSel);
            $subordinados[] = $idSel; // Incluir al jefe
            $lista = implode(",", $subordinados);
            if(!empty($lista)) {
                $whereClause .= " AND c.id_eje2 IN ($lista)";
            } else {
                 $whereClause .= " AND c.id_eje2 = $idSel"; // Fallback
            }
        }
        // Modo Individual
        else {
            $whereClause .= " AND c.id_eje2 = $idSel";
        }
    }
}

// 5. CONSULTA SQL
$data = array();
$sql = "SELECT c.id_cit, c.nom_cit, c.id_eje2, c.cit_cit, c.hor_cit, c.comentarios, e.tel_eje AS tel_eje  
        FROM cita c
        LEFT JOIN ejecutivo e ON c.id_eje2 = e.id_eje
        $whereClause 
        ORDER BY c.cit_cit DESC, c.hor_cit ASC"; // Ordenado por fecha

$result = $connection->query($sql);

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $data[] = $row; 
    }
} else {
    $data = []; // Si falla, devolvemos array vacío
}

$response = array(
    'metadata' => $metadata,
    'data' => $data,
    'ejecutivos' => $ejecutivos,
    'DEBUG_INFO' => array(
        'LO_QUE_LLEGO_RAW' => isset($_GET['id_eje']) ? $_GET['id_eje'] : 'Nada',
        'LO_QUE_ENTENDIO_PHP' => ($idRaw === '') ? 'VACIO (BLOQUEADO)' : $idRaw,
        'SQL_GENERADO' => $sql
    )
);

echo json_encode($response);
$connection->close();
?>