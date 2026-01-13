<?php
include "conexion.php";

$accion = isset($_POST['accion']) ? $_POST['accion'] : '';
//manejo de nodos para diferencar si se crea o se renombra
if ($accion == 'crear_o_renombrar') {
    $id = $_POST['id']; // ID de jsTree (puede ser temporal o real)
    $texto = $connection->real_escape_string($_POST['texto']);
    $padre = $_POST['padre'] == '#' ? 'NULL' : (int)$_POST['padre'];

    // Si el ID empieza con 'j', es un nodo nuevo (Insert)
    if (strpos($id, 'j') === 0) {
        $sql = "INSERT INTO ejecutivo (nom_eje, id_padre, eli_eje) VALUES ('$texto', $padre, 1)";
        if ($connection->query($sql)) {
            echo json_encode(array("id" => $connection->insert_id));
        }
    } else {
        // Es un nodo existente (Update nombre)
        $sql = "UPDATE ejecutivo SET nom_eje = '$texto' WHERE id_eje = " . (int)$id;
        $connection->query($sql);
        echo json_encode(array("status" => "ok"));
    }
}
// no borra la fila de la base, solo cambia el status a 0 
if ($accion == 'eliminar') {
    $id = (int)$_POST['id'];
    // Borrado lógico
    $sql = "UPDATE ejecutivo SET eli_eje = 0 WHERE id_eje = $id";
    $connection->query($sql);
    echo json_encode(array("status" => "ok"));

}

$connection->close();
?>