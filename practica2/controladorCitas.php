<?php
/* ===========================
   CONTROLADOR AJAX - CITAS
   =========================== */
header('Content-Type: application/json; charset=utf-8');

include 'funcionesBasicas.php';
include 'conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo respuestaError('Método no permitido', 405);
    exit;
}

$action = isset($_POST['action']) ? escape($_POST['action'], $connection) : '';

switch($action) {

    // ==============================
    // READ - OBTENER CITAS
    // ==============================
    case 'obtener_citas':
        $filtro = isset($_POST['filtro']) ? escape($_POST['filtro'], $connection) : '';

        $query = "
            SELECT c.id_cita, c.nom_cita, e.nom_eje
            FROM cita c
            LEFT JOIN ejecutivo e ON c.id_eje2 = e.id_eje
            WHERE c.nom_cita LIKE '%$filtro%'
            ORDER BY c.nom_cita ASC
        ";

        $datos = ejecutarConsulta($query, $connection);

        if ($datos !== false) {
            echo respuestaExito($datos, 'Citas obtenidas correctamente');
        } else {
            echo respuestaError('Error al consultar citas: ' . mysqli_error($connection));
        }
        break;

    // ==============================
    // CREATE - GUARDAR CITA
    // ==============================
    case 'guardar_cita':
        $nom_cita = isset($_POST['nom_cita']) ? escape($_POST['nom_cita'], $connection) : '';
        $id_eje2  = isset($_POST['id_eje2']) ? (int) $_POST['id_eje2'] : 0;

        if (empty($nom_cita) || $id_eje2 <= 0) {
            echo respuestaError('Datos incompletos o inválidos', 422);
            mysqli_close($connection);
            exit;
        }

        $query = "INSERT INTO cita (nom_cita, id_eje2) VALUES ('$nom_cita', '$id_eje2')";

        if (mysqli_query($connection, $query)) {
            echo respuestaExito(['id' => mysqli_insert_id($connection)], 'Cita guardada correctamente');
        } else {
            echo respuestaError('Error al guardar cita: ' . mysqli_error($connection));
        }
        break;

    // ==============================
    // UPDATE - EDITAR CITA
    // ==============================
    case 'editar_cita':
        $id_cita  = isset($_POST['id_cita']) ? (int) $_POST['id_cita'] : 0;
        $nom_cita = isset($_POST['nom_cita']) ? escape($_POST['nom_cita'], $connection) : '';
        $id_eje2  = isset($_POST['id_eje2']) ? (int) $_POST['id_eje2'] : 0;

        if ($id_cita <= 0 || empty($nom_cita) || $id_eje2 <= 0) {
            echo respuestaError('Datos incompletos o inválidos', 422);
            mysqli_close($connection);
            exit;
        }

        $query = "UPDATE cita SET nom_cita='$nom_cita', id_eje2='$id_eje2' WHERE id_cita=$id_cita";

        if (mysqli_query($connection, $query)) {
            echo respuestaExito(['id' => $id_cita], 'Cita actualizada correctamente');
        } else {
            echo respuestaError('Error al actualizar cita: ' . mysqli_error($connection));
        }
        break;

    // ==============================
    // DELETE - ELIMINAR CITA
    // ==============================
    case 'eliminar_cita':
        $id_cita = isset($_POST['id_cita']) ? (int) $_POST['id_cita'] : 0;

        if ($id_cita <= 0) {
            echo respuestaError('ID de cita inválido', 422);
            mysqli_close($connection);
            exit;
        }

        $query = "DELETE FROM cita WHERE id_cita=$id_cita";

        if (mysqli_query($connection, $query)) {
            echo respuestaExito(['id' => $id_cita], 'Cita eliminada correctamente');
        } else {
            echo respuestaError('Error al eliminar cita: ' . mysqli_error($connection));
        }
        break;

    default:
        echo respuestaError('Acción no válida');
        break;
}

mysqli_close($connection);
exit;
?>