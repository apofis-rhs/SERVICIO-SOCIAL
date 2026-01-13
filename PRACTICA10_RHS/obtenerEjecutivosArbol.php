<?php
include "conexion.php";
//con este se notifica que se va a enviar un json
header('Content-Type: application/json');

// Seleccionamos solo los ejecutivos visibles por el eli?eje
$sql = "SELECT id_eje, nom_eje, id_padre FROM ejecutivo WHERE eli_eje = 1";
$result = $connection->query($sql);

$items = array();

if ($result) {
    while ($row = $result->fetch_assoc()) {
        // jsTree necesita que el nodo raíz tenga '#' como padre
        $padre = ($row['id_padre'] == 0 || $row['id_padre'] == null) ? "#" : $row['id_padre'];
        
        $items[] = array(
            "id"     => $row['id_eje'],
            "parent" => $padre,
            "text"   => $row['nom_eje']
        );
    }
    //el comando echo json_encode($items) convierte el arreglo de PHP en una cadena de texto JSON, como un diccionario jeje
    
    echo json_encode($items);
} else {
    echo json_encode(array("error" => $connection->error));
}

$connection->close();
?>