<?php
include "conexion.php";
// Es vital el charset utf-8 para que el emoji 🕋 se vea bien y no como caracteres raros
header('Content-Type: application/json; charset=utf-8');

$data = array();

// --- 1. OBTENER PLANTELES (Nodos Raíz) ---
// (Esta parte no cambia, sigue igual que antes)
$sqlPlanteles = "SELECT id_pla, nom_pla FROM plantel";
$resPla = $connection->query($sqlPlanteles);

if ($resPla) {
    while ($row = $resPla->fetch_assoc()) {
        $data[] = array(
            "id"     => "P" . $row['id_pla'], 
            "parent" => "#",                  
            "text"   => $row['nom_pla'],
            "type"   => "plantel",            
            "state"  => array("opened" => true) 
        );
    }
}

// --- 2. OBTENER EJECUTIVOS CON CONTEO DE PERMISOS (¡CAMBIO IMPORTANTE!) ---
// Usamos una subconsulta (SELECT COUNT...) para saber cuántos permisos tiene cada uno
$sqlEjecutivos = "SELECT 
                    e.id_eje, 
                    e.nom_eje, 
                    e.id_padre, 
                    e.id_pla1,
                    (SELECT COUNT(*) FROM planteles_ejecutivo pe WHERE pe.id_eje = e.id_eje) AS num_permisos
                  FROM ejecutivo e 
                  WHERE e.eli_eje = 1";

$resEje = $connection->query($sqlEjecutivos);

if ($resEje) {
    while ($row = $resEje->fetch_assoc()) {
        
        // --- Lógica de Padre (Igual que antes) ---
        $idPadre = (int)$row['id_padre'];
        $idPla   = (int)$row['id_pla1'];

        if ($idPadre === 0) {
            $parent = "P" . $idPla;
        } else {
            $parent = (string)$idPadre;
        }

        // --- NUEVA LÓGICA DE EMOJIS 🕋 ---
        $emojis = "";
        $cantidadPermisos = (int)$row['num_permisos'];

        if ($cantidadPermisos > 0) {
            // Repetimos el emoji tantas veces como permisos tenga (ej: 2 permisos = " 🕋🕋")
            $emojis = " " . str_repeat("🕋", $cantidadPermisos);
        }

        $data[] = array(
            "id"     => (string)$row['id_eje'],
            "parent" => $parent,
            // Aquí concatenamos el nombre + los cubos
            "text"   => $row['nom_eje'] . $emojis, 
            "type"   => "ejecutivo",  
            
            // Guardamos datos extra que nos servirán para el filtro después
            "data"   => array(
                "id_pla" => $idPla,
                "tiene_permisos" => ($cantidadPermisos > 0) 
            ) 
        );
    }
}

echo json_encode($data);
$connection->close();
?>