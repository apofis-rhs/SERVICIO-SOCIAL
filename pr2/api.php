<?php
include "conexion.php";

$accion = isset($_POST['accion']) ? $_POST['accion'] : '';

switch ($accion) {

    /* ============================
            LISTAR DATOS
    ============================== */
    case "listar":
        $sql = "SELECT c.id_cit, c.nom_cit, e.nom_eje, e.tel_eje, c.id_eje2
                FROM cita c 
                INNER JOIN ejecutivo e ON c.id_eje2 = e.id_eje";
        $res = $connection->query($sql);

        $datos = [];
        while ($row = $res->fetch_assoc()) {
            $datos[] = $row;
        }

        echo json_encode($datos);
        break;


    /* ============================
            AGREGAR EJECUTIVO
    ============================== */
    case "add_eje":
        $stmt = $connection->prepare("INSERT INTO ejecutivo (nom_eje, tel_eje) VALUES (?, ?)");
        $stmt->bind_param("ss", $_POST["nombre_eje"], $_POST["tel"]);
        $stmt->execute();
        
        echo "ok";
    break;


    /* ============================
            AGREGAR CITA
    ============================== */
    case "add_cita":
        $stmt = $connection->prepare("INSERT INTO cita (nom_cit, id_eje2) VALUES (?, ?)");
        $stmt->bind_param("si", $_POST["nombre_cita"], $_POST["ejecutivo"]);
        $stmt->execute();
        echo "ok";
    break;


    /* ============================
            ELIMINAR CITA
    ============================== */
    case "del_cita":
        $id = $_POST["id"];
        $connection->query("DELETE FROM cita WHERE id_cit = $id");
        echo "ok";
    break;


    /* ============================
            OBTENER CITA
    ============================== */
    case "get_cita":
        $id = $_POST["id"];

        $stmt = $connection->prepare("SELECT * FROM cita WHERE id_cit = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $res = $stmt->get_result()->fetch_assoc();

        echo json_encode($res);
    break;


    /* ============================
            EDITAR CITA
    ============================== */
    case "edit_cita":
        $id = $_POST["id"];
        $nombre_cita = $_POST["nombre_cita"];
        $ejecutivo = $_POST["ejecutivo"];

        $stmt = $connection->prepare("UPDATE cita SET nom_cit = ?, id_eje2 = ? WHERE id_cit = ?");
        $stmt->bind_param("sii", $nombre_cita, $ejecutivo, $id);
        $stmt->execute();

        echo "ok";
    break;


    default:
        echo "acción no válida";
}
?>
