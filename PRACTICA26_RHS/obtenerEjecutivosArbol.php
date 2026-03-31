<?php
include "conexion.php";
error_reporting(0);
header('Content-Type: application/json; charset=utf-8');
$connection->set_charset("utf8");



$filtroFechaSQL = ""; 
if (isset($_GET['inicio']) && isset($_GET['fin']) && $_GET['inicio'] != '' && $_GET['fin'] != '') {
    $inicio = $_GET['inicio'];
    $fin = $_GET['fin'];
    $filtroFechaSQL = " AND cit_cit BETWEEN '$inicio' AND '$fin' ";
}

$data = array();
$mapaHijos = array();      
$conteoPropio = array();   
$conteoRecursivo = array(); 


$sqlConteos = "SELECT id_eje2, COUNT(*) as total FROM cita WHERE eli_cit = 1 $filtroFechaSQL GROUP BY id_eje2";
$resConteos = $connection->query($sqlConteos);

while($row = $resConteos->fetch_assoc()) {
    $conteoPropio[ $row['id_eje2'] ] = (int)$row['total'];
}

//  NUEVO: Consulta independiente y blindada para los Planteles 
$conteoPlantel = array();
$sqlConteosPla = "SELECT id_plantel, COUNT(*) as total FROM cita WHERE eli_cit = 1 $filtroFechaSQL GROUP BY id_plantel";
$resConteosPla = $connection->query($sqlConteosPla);

if ($resConteosPla) {
    while($row = $resConteosPla->fetch_assoc()) {
        if ($row['id_plantel'] != null) {
            $conteoPlantel[ $row['id_plantel'] ] = (int)$row['total'];
        }
    }
}


$todosEjecutivos = array();


$sqlEje = "SELECT 
            e.id_eje, 
            e.nom_eje, 
            e.id_padre, 
            e.id_pla1, 
            e.ult_eje,  
            (SELECT COUNT(*) FROM planteles_ejecutivo pe WHERE pe.id_eje = e.id_eje) AS num_permisos /* <--- NECESARIO PARA CUBOS */
           FROM ejecutivo e 
           WHERE e.eli_eje = 1";

$resEje = $connection->query($sqlEje);

while($row = $resEje->fetch_assoc()) {
    $id = $row['id_eje'];
    $todosEjecutivos[$id] = $row;
    
    // Mapa de Hijos
    $padre = $row['id_padre'];
    if($padre != NULL) {
        $mapaHijos[$padre][] = $id;
    }
}


function calcularRecursivo($idEjecutivo, &$conteoPropio, &$mapaHijos, &$conteoRecursivo) {
    if(isset($conteoRecursivo[$idEjecutivo])) return $conteoRecursivo[$idEjecutivo];

    $total = isset($conteoPropio[$idEjecutivo]) ? $conteoPropio[$idEjecutivo] : 0;

    if(isset($mapaHijos[$idEjecutivo])) {
        foreach($mapaHijos[$idEjecutivo] as $idHijo) {
            $total += calcularRecursivo($idHijo, $conteoPropio, $mapaHijos, $conteoRecursivo);
        }
    }

    $conteoRecursivo[$idEjecutivo] = $total;
    return $total;
}

foreach($todosEjecutivos as $id => $datos) {
    calcularRecursivo($id, $conteoPropio, $mapaHijos, $conteoRecursivo);
}

$sqlPlantel = "SELECT id_pla, nom_pla FROM plantel";
$resPla = $connection->query($sqlPlantel);

while($row = $resPla->fetch_assoc()) {
    $idPla = "P" . $row['id_pla'];

    $totalPlantel = isset($conteoPlantel[$row['id_pla']]) ? $conteoPlantel[$row['id_pla']] : 0;
    
    // Icono opcional para plantel
    $textoPlantel = "🏠 " . $row['nom_pla'] . " <span class='badge-recursivo'>$totalPlantel</span>";

    $data[] = array(
        "id" => $idPla,
        "parent" => "#",
        "text" => $textoPlantel,
        "type" => "plantel",
        "state" => array("opened" => true)
    );
}
    
    

// B) NODOS DE EJECUTIVOS (CON EMOJIS)
foreach($todosEjecutivos as $id => $row) {
    
    // --- 1. LÓGICA SEMÁFORO (🔐) ---
    $iconoSem = "🔴"; // Rojo por defecto
    $tooltip = "Sin registro de sesión";

    if (isset($row['ult_eje']) && !empty($row['ult_eje'])) {
        try {
            $fechaUltima = new DateTime($row['ult_eje']);
            $fechaHoy = new DateTime();
            $diferencia = $fechaHoy->diff($fechaUltima)->days;

            if ($diferencia <= 1) {
                $iconoSem = "🟢"; // Hoy o ayer
            } elseif ($diferencia <= 3) {
                $iconoSem = "🟡"; // 2 o 3 días
            } else {
                $iconoSem = "🔴"; // 4 días o más
            }
            $tooltip = "Última sesión: " . $row['ult_eje'];
        } catch (Exception $e) {}
    }

    // --- 2. LÓGICA CUBOS DE PERMISOS (🕋) ---
    $emojisPermisos = "";
    $cantidadPermisos = (int)$row['num_permisos'];
    if ($cantidadPermisos > 0) {
        // str_repeat repite el emoji tantas veces como permisos tenga
        $emojisPermisos = " " . str_repeat("🕋", $cantidadPermisos);
    }

    // 3. LÓGICA BADGES (⚪🟣) 
    $citasMias = isset($conteoPropio[$id]) ? $conteoPropio[$id] : 0;
    $citasEquipo = isset($conteoRecursivo[$id]) ? $conteoRecursivo[$id] : 0;
    $htmlBadges = " <span class='badge-propio'>$citasMias</span> <span class='badge-recursivo'>$citasEquipo</span>";

  
    $textoNodo = $row['nom_eje'] . $emojisPermisos . " " . $iconoSem . $htmlBadges;

    $padreFinal = ($row['id_padre'] != NULL) ? $row['id_padre'] : "P" . $row['id_pla1'];

    $data[] = array(
        "id" => $row['id_eje'],
        "parent" => $padreFinal,
        "text" => $textoNodo,
        "type" => "ejecutivo",
        "a_attr" => array("title" => $tooltip) // Tooltip al pasar el mouse
    );
}

echo json_encode($data);
?>