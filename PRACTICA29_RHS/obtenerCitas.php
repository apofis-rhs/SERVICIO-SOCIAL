<?php
include "conexion.php";
header('Content-Type: application/json');

// --- 1. FUNCIÓN DE RECURSIVIDAD ---
function obtenerSubordinados($conexion, $idPadre) {
    $ids = array();
    $hijosDirectos = array();
    
    $sql = "SELECT id_eje FROM ejecutivo WHERE id_padre = $idPadre AND eli_eje = 1";
    $res = $conexion->query($sql);
    
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $hijosDirectos[] = $row['id_eje'];
        }
        $res->free(); 
    }

    foreach ($hijosDirectos as $hijoID) {
        $ids[] = $hijoID;
        $nietos = obtenerSubordinados($conexion, $hijoID);
        $ids = array_merge($ids, $nietos);
    }

    return $ids;
}

// --- 2. OBTENER EJECUTIVOS ---
$ejecutivos = [];
$nombresParaDropdown = [];

$filtroTipoEjeDropDown = "";
if (isset($_GET['tipo_eje']) && $_GET['tipo_eje'] !== 'Todos' && $_GET['tipo_eje'] !== '') {
    $tipoEje = $connection->real_escape_string($_GET['tipo_eje']);
    $filtroTipoEjeDropDown = " AND tipo_eje = '$tipoEje' ";
}

$resEje = $connection->query("SELECT id_eje, nom_eje, tel_eje FROM ejecutivo WHERE eli_eje = 1 ORDER BY nom_eje ASC");
if ($resEje) {
    while($e = $resEje->fetch_assoc()){
        $ejecutivos[] = ['id' => $e['id_eje'], 'label' => $e['nom_eje'], 'tel' => $e['tel_eje']];
        $nombresParaDropdown[] = $e['nom_eje'];
    }
}

// --- 3. METADATA ---
$metadata = [
    ['header' => 'HORARIO', 'data' => 'rango_fijo', 'type' => 'text', 'readOnly' => true],
    ['header' => 'ID', 'data' => 'id_cit', 'type' => 'numeric', 'readOnly' => true],
    ['header' => 'Estatus', 'data' => 'est_cit', 'type' => 'dropdown', 'source' => [
        'CITA AGENDADA', 
        'INVASIÓN DE CICLO', 
        'CITA REAGENDADA', 
        'CITA NO ATENDIDA', 
        'PAGO ESPERADO', 
        'PERDIDO POR PRECIO', 
        'PERDIDO POR HORARIO', 
        'REGISTRO', 
        'NO LE INTERESA', 
        'ASESORÍA REALIZADA', 
        'CITA CONFIRMADA'
    ]],
    ['header' => 'Efectividad', 'data' => 'efe_cit', 'type' => 'dropdown', 'source' => [
        'CITA EFECTIVA', 
        'CITA NO EFECTIVA'
    ]],

    ['header' => 'Fecha', 'data' => 'cit_cit', 'type' => 'date', 'dateFormat' => 'YYYY-MM-DD', 'className' => 'htCenter'],
    ['header' => 'Hora', 'data' => 'hor_cit', 'type' => 'time', 'timeFormat' => 'HH:mm:ss', 'className' => 'htCenter'],
    ['header' => 'Nombre Cita', 'data' => 'nom_cit', 'type' => 'text'],
    ['header' => 'EJECUTIVO', 'data' => 'id_eje2', 'type' => 'dropdown', 'source' => $nombresParaDropdown, 'sourceFull' => $ejecutivos],
    ['header' => 'Tel. Ejecutivo', 'data' => 'tel_eje', 'type' => 'text', 'readOnly' => true],
    ['header' => 'Comentarios', 'data' => 'comentarios', 'type' => 'text']
];

// --- 4. FILTROS Y WHERE ---
$whereClause = "WHERE c.eli_cit = 1"; 

if (isset($_GET['inicio']) && isset($_GET['fin']) && $_GET['inicio'] != '' && $_GET['fin'] != '') {
    $inicio = $_GET['inicio'];
    $fin = $_GET['fin'];
    $whereClause .= " AND c.cit_cit BETWEEN '$inicio' AND '$fin'";
}

$idRaw = isset($_GET['id_eje']) ? $_GET['id_eje'] : '';

if ($idRaw === 'null' || $idRaw === 'undefined' || trim($idRaw) === '') {
    $idRaw = ''; 
}

if ($idRaw === '') {
    $whereClause .= " AND 1 = 0";
} else {
    $modo = isset($_GET['modo']) ? $_GET['modo'] : 'individual';

    if (strpos($idRaw, 'P') === 0) {
        $idPlantel = (int)str_replace('P', '', $idRaw);
        //  CAMBIO: Ahora filtramos por el id_plantel directo de la tabla cita
        $whereClause .= " AND c.id_plantel = $idPlantel";
    }
    else {
        $idSel = (int)$idRaw;
        if (strpos($modo, 'permiso_') === 0) {
            $idDestino = (int)str_replace('permiso_', '', $modo);
            
            //  NUEVO: Lo mismo para los permisos especiales 
            $whereClause .= " AND c.id_plantel = $idDestino"; 
        }
        else if ($modo == 'arbol') {
            $subordinados = obtenerSubordinados($connection, $idSel);
            $subordinados[] = $idSel; 
            $lista = implode(",", $subordinados);
            if(!empty($lista)) {
                $whereClause .= " AND c.id_eje2 IN ($lista)";
            } else {
                 $whereClause .= " AND c.id_eje2 = $idSel"; 
            }
        }
        else {
            $whereClause .= " AND c.id_eje2 = $idSel";
        }
    }
}

if (isset($_GET['tipo_eje']) && $_GET['tipo_eje'] !== 'Todos' && $_GET['tipo_eje'] !== '') {
            $tipoEje = $connection->real_escape_string($_GET['tipo_eje']);
            $whereClause .= " AND e.tipo_eje = '$tipoEje' ";
        }
        

// --- 5. CONSULTA PRINCIPAL ($data) ---
$data = array();
$sql = "SELECT c.id_cit, c.id_plantel,c.est_cit, c.efe_cit, c.nom_cit, c.id_eje2, c.cit_cit, c.hor_cit, c.comentarios, e.tel_eje AS tel_eje  
        FROM cita c
        LEFT JOIN ejecutivo e ON c.id_eje2 = e.id_eje
        $whereClause 
        ORDER BY c.cit_cit DESC, c.hor_cit ASC";

$result = $connection->query($sql);

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $data[] = $row; 
    }
} else {
    $data = []; 
}



// --- 6. OBTENER COMENTARIOS Y ESTILOS ---
$comentarios = [];
$estilos = [];

// Solo si hay citas cargadas procedemos a buscar sus detalles
if (!empty($data)) {
    // Obtenemos los IDs de las citas cargadas
    $idsCargados = array_column($data, 'id_cit');
    
    if(count($idsCargados) > 0) {
        // Creamos la cadena de IDs UNA SOLA VEZ
        $idsStr = implode(',', $idsCargados);
        
        // A. COMENTARIOS
        $sqlCom = "SELECT id_cit, campo, comentario FROM cita_comentarios WHERE id_cit IN ($idsStr)";
        $resCom = $connection->query($sqlCom);
        if ($resCom) {
            while ($row = $resCom->fetch_assoc()) {
                $comentarios[] = $row;
            }
        }

        // B. ESTILOS (COLORES) - LÓGICA NUEVA
        $sqlEst = "SELECT id_cit, campo, color FROM cita_celdas_estilo WHERE id_cit IN ($idsStr)";
        $resEst = $connection->query($sqlEst);
        if ($resEst) {
            while ($row = $resEst->fetch_assoc()) {
                $estilos[] = $row;
            }
        }
    }
}

// --- 7. RESPUESTA FINAL ---
$response = array(
    'metadata' => $metadata,
    'data' => $data,
    'ejecutivos' => $ejecutivos,
    'comentarios' => $comentarios,
    'estilos' => $estilos, // Aquí van los colores
    'DEBUG_INFO' => array(
        'LO_QUE_LLEGO_RAW' => isset($_GET['id_eje']) ? $_GET['id_eje'] : 'Nada',
        'LO_QUE_ENTENDIO_PHP' => (isset($idRaw) && $idRaw === '') ? 'VACIO (BLOQUEADO)' : (isset($idRaw) ? $idRaw : ''),
        'SQL_GENERADO' => $sql
    )
);

echo json_encode($response);
$connection->close();
?>