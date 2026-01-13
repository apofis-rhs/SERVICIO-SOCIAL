<?php
include "conexion.php";

$accion = isset($_POST['accion']) ? $_POST['accion'] : '';

// CREAR O RENOMBRAR ---
if ($accion == 'crear_o_renombrar') {
    $id = $_POST['id']; 
    $texto = $connection->real_escape_string($_POST['texto']);
    $padre = $_POST['padre'];

    // Lógica para determinar plantel inicial al CREAR
    $id_padre_sql = "NULL";
    $id_pla_sql = "NULL"; 

    if ($padre != '#') {
        if (strpos($padre, 'P') === 0) {
            // Padre es un Plantel (ej: P2)  
            $id_pla_sql = str_replace('P', '', $padre);
        } else {
            // Padre es un Ejecutivo -> Heredamos su plantel
            $id_padre_sql = (int)$padre;
            // Buscamos el plantel del jefe
            $res = $connection->query("SELECT id_pla1 FROM ejecutivo WHERE id_eje = $id_padre_sql");
            if ($row = $res->fetch_assoc()) {
                $id_pla_sql = $row['id_pla1'];
            }
        }
    }

    if (strpos($id, 'j') === 0) {
        // INSERT (Nuevo Ejecutivo)
        $sql = "INSERT INTO ejecutivo (nom_eje, id_padre, id_pla1, eli_eje) 
                VALUES ('$texto', $id_padre_sql, $id_pla_sql, 1)";
        if ($connection->query($sql)) {
            echo json_encode(array("id" => $connection->insert_id));
        } else {
             echo json_encode(array("error" => $connection->error));
        }
    } else {
        // UPDATE (Solo nombre)
        $sql = "UPDATE ejecutivo SET nom_eje = '$texto' WHERE id_eje = " . (int)$id;
        $connection->query($sql);
        echo json_encode(array("status" => "ok"));
    }
}

// --- CASO 2: MOVER (DRAG & DROP) ---
if ($accion == 'mover_nodo') {
    $id_eje = (int)$_POST['id_eje'];
    $id_padre = $_POST['id_padre']; // Puede ser 'NULL' o un número
    $id_pla = $_POST['id_pla'];     // Puede ser un número o 'HEREDAR'

    // 1. Preparar id_padre
    $id_padre_final = ($id_padre === 'NULL') ? "NULL" : (int)$id_padre;

    // 2. Preparar id_pla1
    $id_pla_final = 0;

    if ($id_pla === 'HEREDAR') {
        // Consultamos el plantel del nuevo jefe
        $res = $connection->query("SELECT id_pla1 FROM ejecutivo WHERE id_eje = $id_padre_final");
        if ($row = $res->fetch_assoc()) {
            $id_pla_final = $row['id_pla1'];
        }
    } else {
        // Viene directo del frontend (se soltó en un plantel)
        $id_pla_final = (int)$id_pla;
    }

    // 3. Ejecutar actualización
    // Actualizamos tanto el padre como el plantel
    $sql = "UPDATE ejecutivo 
            SET id_padre = $id_padre_final, 
                id_pla1 = $id_pla_final 
            WHERE id_eje = $id_eje";
            
    if ($connection->query($sql)) {
        echo json_encode(array("status" => "movimiento_exitoso"));
    } else {
        echo json_encode(array("error" => $connection->error));
    }
}

// ELIMINAR 
if ($accion == 'eliminar') {
    $id = (int)$_POST['id'];
    $sql = "UPDATE ejecutivo SET eli_eje = 0 WHERE id_eje = $id";
    $connection->query($sql);
    echo json_encode(array("status" => "ok"));
}

$connection->close();
?>