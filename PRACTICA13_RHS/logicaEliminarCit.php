<?php
include "conexion.php";

if (isset($_POST['id_cit'])) {
    $id_cita = (int) $_POST['id_cit'];

    // Sumula un responsable al azar
    $resRandom = $connection->query("SELECT nom_eje FROM ejecutivo ORDER BY RAND() LIMIT 1");
    $rowRandom = $resRandom->fetch_assoc();
    $ejecutivoLog = isset($rowRandom['nom_eje']) ? $rowRandom['nom_eje'] : 'Sistema';

    //  Obtiene el nombre de la cita para que se vea "se elimino la cita cita nomina a solo se elimino la cita 2"
    $resNom = $connection->query("SELECT nom_cit FROM cita WHERE id_cit = $id_cita");
    $rowNom = $resNom->fetch_assoc();
    $nomCita = isset($rowNom['nom_cit']) ? $rowNom['nom_cit'] : 'Desconocida';

    // si se borra cambia el estado a 0 y no aparece
    $sql_logic_delete = "UPDATE cita SET eli_cit = 0 WHERE id_cit = $id_cita";

    if ($connection->query($sql_logic_delete) === TRUE) {
        
        // --- 4. REGISTRAR EN EL HISTORIAL (LOG) ---
        $descripcion = "El usuario " . $ejecutivoLog . " realizó la baja de la cita '" . $nomCita . "' (ID: " . $id_cita . ").";
        
        // Sanitizamos por si el nombre de la cita tiene comillas
        $desc_sanitizada = $connection->real_escape_string($descripcion);
        
        $sql_log = "INSERT INTO historial_cita (res_his_cit, mov_his_cit, des_his_cit, id_cit11) 
                    VALUES ('$ejecutivoLog', 'baja', '$desc_sanitizada', $id_cita)";
        
        $connection->query($sql_log);
        // ------------------------------------------

        echo "Cita con ID $id_cita marcada como oculta y registrada en historial.";
    } else {
        http_response_code(500);
        echo "Error al intentar ocultar la cita: " . $connection->error;
    }
} else {
    http_response_code(400);
    echo "ID de cita no proporcionado.";
}

$connection->close();
?>