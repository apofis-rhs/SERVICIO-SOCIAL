<?php
include "conexion.php";


// (Igual que en citas, elegimos uno al azar para el ejemplo)

$resRandom = $connection->query("SELECT nom_eje FROM ejecutivo ORDER BY RAND() LIMIT 1");
$rowRandom = $resRandom->fetch_assoc();
$ejecutivoLog = isset($rowRandom['nom_eje']) ? $rowRandom['nom_eje'] : 'Sistema';


$accion = isset($_POST['accion']) ? $_POST['accion'] : '';

// CASO 1: CREAR O RENOMBRAR

if ($accion == 'crear_o_renombrar') {
    $id = $_POST['id']; 
    $texto = $connection->real_escape_string($_POST['texto']);
    $padre = $_POST['padre'];

    //  Lógica para determinar plantel inicial al CREAR 
    $id_padre_sql = "NULL";
    $id_pla_sql = "NULL";

    if ($padre != '#') {
        if (strpos($padre, 'P') === 0) {
            $id_pla_sql = str_replace('P', '', $padre);
        } else {
            $id_padre_sql = (int)$padre;
            $res = $connection->query("SELECT id_pla1 FROM ejecutivo WHERE id_eje = $id_padre_sql");
            if ($row = $res->fetch_assoc()) {
                $id_pla_sql = $row['id_pla1'];
            }
        }
    }

    // A) ES NUEVO (INSERT) 
    if (strpos($id, 'j') === 0) {
        $sql = "INSERT INTO ejecutivo (nom_eje, id_padre, id_pla1, eli_eje) 
                VALUES ('$texto', $id_padre_sql, $id_pla_sql, 1)";
        
        if ($connection->query($sql)) {
            $nuevoID = $connection->insert_id;
            
            //  LOG DE ALTA
            $desc = "El usuario $ejecutivoLog dio de alta al ejecutivo '$texto'.";
            registrarHistorialEjecutivo($connection, $ejecutivoLog, 'alta', $desc, $nuevoID);

            echo json_encode(array("id" => $nuevoID));
        } else {
             echo json_encode(array("error" => $connection->error));
        }
    } 
    // B) ES EXISTENTE (UPDATE NOMBRE) 
    else {
        $idReal = (int)$id;
        
        // 1. Obtenemos el nombre ANTERIOR para comparar
        $sqlOld = "SELECT nom_eje FROM ejecutivo WHERE id_eje = $idReal";
        $resOld = $connection->query($sqlOld);
        $rowOld = $resOld->fetch_assoc();
        $nombreViejo = $rowOld['nom_eje'];

        // 2. Actualizamos
        $sql = "UPDATE ejecutivo SET nom_eje = '$texto' WHERE id_eje = $idReal";
        $connection->query($sql);

        //  LOG DE CAMBIO DE NOMBRE (Solo si cambió)
        if ($nombreViejo != $texto) {
            $desc = "El usuario $ejecutivoLog hizo un cambio en nom_eje de '$nombreViejo' por '$texto'.";
            registrarHistorialEjecutivo($connection, $ejecutivoLog, 'cambio', $desc, $idReal);
        }

        echo json_encode(array("status" => "ok"));
    }
}

// CASO 2: MOVER (DRAG & DROP) 

if ($accion == 'mover_nodo') {
    $id_eje = (int)$_POST['id_eje'];
    $id_padre = $_POST['id_padre'];
    $id_pla = $_POST['id_pla'];

    $id_padre_final = ($id_padre === 'NULL') ? "NULL" : (int)$id_padre;
    $id_pla_final = 0;

    if ($id_pla === 'HEREDAR') {
        $res = $connection->query("SELECT id_pla1 FROM ejecutivo WHERE id_eje = $id_padre_final");
        if ($row = $res->fetch_assoc()) {
            $id_pla_final = $row['id_pla1'];
        }
    } else {
        $id_pla_final = (int)$id_pla;
    }

    
    $sql = "UPDATE ejecutivo 
            SET id_padre = $id_padre_final, 
                id_pla1 = $id_pla_final 
            WHERE id_eje = $id_eje";
            
    if ($connection->query($sql)) {
        // LOG DE MOVIMIENTO
        // Recuperamos el nombre para que el log quede bonito
        $resNom = $connection->query("SELECT nom_eje FROM ejecutivo WHERE id_eje = $id_eje");
        $rowNom = $resNom->fetch_assoc();
        $nomEje = $rowNom['nom_eje'];

        $desc = "El usuario $ejecutivoLog cambió la ubicación/jefe de '$nomEje' en el organigrama.";
        registrarHistorialEjecutivo($connection, $ejecutivoLog, 'cambio', $desc, $id_eje);

        echo json_encode(array("status" => "movimiento_exitoso"));
    } else {
        echo json_encode(array("error" => $connection->error));
    }
}


// CASO 3: ELIMINAR (BAJA LÓGICA) 

if ($accion == 'eliminar') {
    $id = (int)$_POST['id'];

    // 1. Recuperamos el nombre ANTES de borrar para el log
    $resNom = $connection->query("SELECT nom_eje FROM ejecutivo WHERE id_eje = $id");
    $rowNom = $resNom->fetch_assoc();
    $nomEje = isset($rowNom['nom_eje']) ? $rowNom['nom_eje'] : 'Desconocido';

    // 2. Baja lógica
    $sql = "UPDATE ejecutivo SET eli_eje = 0 WHERE id_eje = $id";
    $connection->query($sql);

    // LOG DE BAJA
    $desc = "El usuario $ejecutivoLog realizó la baja del ejecutivo '$nomEje' (ID: $id).";
    registrarHistorialEjecutivo($connection, $ejecutivoLog, 'baja', $desc, $id);

    echo json_encode(array("status" => "ok"));
}



// FUNCIÓN AUXILIAR PARA INSERTAR EN EL HISTORIAL 

function registrarHistorialEjecutivo($conn, $responsable, $tipoMov, $descripcion, $idEje) {
    $descSafe = $conn->real_escape_string($descripcion);
    $sqlLog = "INSERT INTO historial_ejecutivo (res_his_eje, mov_his_eje, des_his_eje, id_eje11) 
               VALUES ('$responsable', '$tipoMov', '$descSafe', $idEje)";
    $conn->query($sqlLog);
}

$connection->close();
?>