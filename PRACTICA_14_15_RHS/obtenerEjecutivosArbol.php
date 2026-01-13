<?php
// 1. Configuración de Limpieza y UTF-8
ob_start();
include "conexion.php";
error_reporting(0);
header('Content-Type: application/json; charset=utf-8');
$connection->set_charset("utf8");

$data = array();
$ids_validos = array(); // Lista para validación anti-huérfanos


// 2. OBTENER PLANTELES 

$sqlPlanteles = "SELECT id_pla, nom_pla FROM plantel";
$resPla = $connection->query($sqlPlanteles);

if ($resPla) {
    while ($row = $resPla->fetch_assoc()) {
        $id_nodo = "P" . $row['id_pla'];
        $ids_validos[] = $id_nodo; 
        
        $data[] = array(
            "id"     => $id_nodo,
            "parent" => "#",
            "text"   => $row['nom_pla'],
            "type"   => "plantel",
            "state"  => array("opened" => true)
        );
    }
}

// 3. OBTENER EJECUTIVOS 

$sqlEjecutivos = "SELECT 
                    e.id_eje,
                    e.nom_eje,
                    e.id_padre,
                    e.id_pla1,
                    e.ult_eje,  /* <--- ESTO FALTABA para el semáforo */
                    (SELECT COUNT(*) FROM planteles_ejecutivo pe WHERE pe.id_eje = e.id_eje) AS num_permisos
                  FROM ejecutivo e 
                  WHERE e.eli_eje = 1";

$resEje = $connection->query($sqlEjecutivos);
$ejecutivos_raw = array();

if ($resEje) {
    while ($row = $resEje->fetch_assoc()) {
        $ejecutivos_raw[] = $row;
        $ids_validos[] = $row['id_eje']; 
    }
}


// 4. PROCESAMIENTO VISUAL FINAL

foreach($ejecutivos_raw as $row) {
    
    // --- A. SEMÁFORO DE CONEXIÓN (🟢🟡🔴) ---
    // Valor por defecto: Rojo (si no hay fecha)
    $iconoSem = "🔴"; 
    $tooltip = "Sin registro de sesión";

    if (isset($row['ult_eje']) && !empty($row['ult_eje'])) {
        try {
            $dias = (new DateTime())->diff(new DateTime($row['ult_eje']))->days;
            if ($dias <= 1) $iconoSem = "🟢";
            else if ($dias <= 3) $iconoSem = "🟡";
            else $iconoSem = "🔴";
            $tooltip = "Última sesión: " . $row['ult_eje'];
        } catch (Exception $e) {}
    }

    
    $emojisPermisos = "";
    $cantidadPermisos = (int)$row['num_permisos'];

    if ($cantidadPermisos > 0) {
        $emojisPermisos = " " . str_repeat("🕋", $cantidadPermisos);
    }

    // --- C. PADRES (ANTI-HUÉRFANOS) ---
    $padre_final = "#"; 
    $padre_original = $row['id_padre'];

    // 1. ¿Tiene jefe válido?
    if ($padre_original != NULL && $padre_original != 0 && in_array($padre_original, $ids_validos)) {
        $padre_final = $padre_original;
    }
    // 2. Si no, va al Plantel
    else {
        $posible_plantel = "P" . $row['id_pla1'];
        if (in_array($posible_plantel, $ids_validos)) {
            $padre_final = $posible_plantel;
        } 
    }

    //  CONSTRUCCIÓN FINAL 
    $data[] = array(
        "id"     => $row['id_eje'],
        "parent" => $padre_final,
        // FUSIÓN: Nombre + Cubos + Semáforo
        "text"   => $row['nom_eje'] . $emojisPermisos . " " . $iconoSem, 
        "type"   => "ejecutivo",
        "a_attr" => array("title" => $tooltip)
    );
}

ob_end_clean();
echo json_encode($data, JSON_UNESCAPED_UNICODE);
$connection->close();
?>