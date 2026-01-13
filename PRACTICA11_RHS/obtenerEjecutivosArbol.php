<?php
include "conexion.php";
header('Content-Type: application/json; charset=utf-8');

$data = array();

//  OBTENER PLANTELES (Nodos Raíz) 
$sqlPlanteles = "SELECT id_pla, nom_pla FROM plantel";
$resPla = $connection->query($sqlPlanteles);

if ($resPla) {
    while ($row = $resPla->fetch_assoc()) {
        $data[] = array(
            "id"     => "P" . $row['id_pla'], // ID String: "P2" para que no se confunda con ejecutivos
            "parent" => "#",                  // Raíz
            "text"   => $row['nom_pla'],
            "type"   => "plantel",            
            "state"  => array("opened" => true) 
        );
    }
}

// OBTENER EJECUTIVOS (Nodos Hijos) 
$sqlEjecutivos = "SELECT id_eje, nom_eje, id_padre, id_pla1 FROM ejecutivo WHERE eli_eje = 1";
$resEje = $connection->query($sqlEjecutivos);

if ($resEje) {
    while ($row = $resEje->fetch_assoc()) {
        
        $idPadre = (int)$row['id_padre'];
        $idPla   = (int)$row['id_pla1'];

        // LÓGICA DE JERARQUÍA
        if ($idPadre === 0) {
            // Si no tiene jefe persona, su padre es el PLANTEL
            $parent = "P" . $idPla;
        } else {
            // Si tiene jefe, su padre es ese jefe
            $parent = (string)$idPadre;
        }

        $data[] = array(
            "id"     => (string)$row['id_eje'],
            "parent" => $parent,
            "text"   => $row['nom_eje'],
            "type"   => "ejecutivo",  
            "data"   => array("id_pla" => $idPla) 
        );
    }
}

echo json_encode($data);
$connection->close();
?>