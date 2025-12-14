
<?php
/* ===========================
   BACKEND - CONTROLADOR
   =========================== */
// Controlador AJAX para citas
header('Content-Type: application/json; charset=utf-8');

// Incluimos conexión y funciones
include 'funcionesBasicas.php';
include 'conexion.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {

    $action = isset($_POST['action']) ? escape($_POST['action'], $connection) : '';

    switch ($action) {

         // ==============================
//  OBTENER EJECUTIVOS
// ==============================
case 'obtener_ejecutivos':
    $query = "SELECT id_eje, nom_eje, telefono FROM ejecutivo ORDER BY nom_eje ASC";
    $datos = ejecutarConsulta($query, $connection);
    if ($datos !== false) {
        echo respuestaExito($datos, 'Ejecutivos obtenidos correctamente');
    } else {
        echo respuestaError('Error al consultar ejecutivos: ' . mysqli_error($connection));
    }
    break;



        // ==============================
        //  OBTENER CITAS
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
        //  GUARDAR CITA
        // ==============================
        case 'guardar_cita':
            $nom_cita = isset($_POST['nom_cita']) ? escape($_POST['nom_cita'], $connection) : '';
            $id_ejec2 = isset($_POST['id_eje2']) ? (int) $_POST['id_eje2'] : 0;

            // Validaciones simples
            if (empty($nom_cita) || $id_eje2 <= 0) {
                echo respuestaError('Datos incompletos o inválidos', 422);
                mysqli_close($connection);
                exit;
            }

            
            $query = "
                INSERT INTO cita (nom_cita, id_eje2)
                VALUES ('$nom_cita', '$id_eje2')
            ";

            if (mysqli_query($connection, $query)) {
                echo respuestaExito(
                    ['id' => mysqli_insert_id($connection)],
                    'Cita guardada correctamente'
                );
            } else {
                echo respuestaError('Error al guardar cita: ' . mysqli_error($connection));
            }
            break;

        default:
            echo respuestaError('Acción no válida');
            break;
    }

    mysqli_close($connection);
    exit;
}

// Si NO es POST
echo respuestaError('Método no permitido', 405);
exit;

?>