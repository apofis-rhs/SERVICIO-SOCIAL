<?php
include "conexion.php";
header('Content-Type: application/json; charset=utf-8');

if (!isset($_GET['id_eje'])) {
    echo json_encode([]);
    exit;
}

$idEje = (int)$_GET['id_eje'];

// Consulta: Busca en la tabla puente el nombre y ID de los planteles permitidos
$sql = "SELECT 
            pe.id_pla, 
            p.nom_pla 
        FROM planteles_ejecutivo pe
        INNER JOIN plantel p ON pe.id_pla = p.id_pla
        WHERE pe.id_eje = $idEje";

$result = $connection->query($sql);

$permisos = array();

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $permisos[] = array(
            'id_pla' => $row['id_pla'],
            'nombre' => $row['nom_pla']
        );
    }
}

echo json_encode($permisos);
$connection->close();
?>