<?php
/* ===========================
   Configuración y conexión
   Archivo: /inc/conexion.php
   =========================== */

/* Datos de conexión a la base de datos.
   - $host: servidor (normalmente "localhost" si la BD está en la misma máquina).
   - $user: usuario de MySQL.
   - $pass: contraseña de ese usuario.
   - $database: nombre de la base de datos. */
$host = "localhost";
$user = "sicam_user";
$pass = "sicam_pass";
$database = "sicam_db";

/* Intenta conectarse a MySQL usando mysqli. 
   Si la conexión falla, mysqli_connect devuelve false. */
$connection = mysqli_connect($host, $user, $pass, $database);

/* Comprueba si la conexión tuvo éxito.
   Si no, detiene la ejecución con die() y muestra el error. */
if (!$connection) {
    die('Error de conexión: ' . mysqli_connect_error());
}

/* Establece el conjunto de caracteres de la conexión a utf8mb4.
   Esto evita problemas con acentos, ñ y emojis. */
mysqli_set_charset($connection, "utf8mb4");


/* ===========================
   Funciones auxiliares
   =========================== */

/**
 * ejecutarConsulta
 * Ejecuta una consulta SQL (generalmente SELECT) y devuelve
 * un arreglo con las filas (cada fila es un array asociativo).
 *
 * @param string $query      La cadena SQL a ejecutar.
 * @param mysqli $connection El objeto/conexión mysqli.
 * @return array|false       Array de filas asociativas o false si falla la consulta.
 */
function ejecutarConsulta($query, $connection) {
    // Ejecuta la consulta
    $result = mysqli_query($connection, $query);

    // Si la consulta falla, devolvemos false
    if (!$result) return false;

    // Recolectamos todas las filas en un arreglo
    $datos = [];
    while($row = mysqli_fetch_assoc($result)) {
        $datos[] = $row;
    }

    // Opcional: liberar resultado (buena práctica)
    mysqli_free_result($result);

    // Devolvemos el arreglo con las filas
    return $datos;
}

/**
 * escape
 * Escapa una cadena para usarla de forma segura en una consulta SQL.
 * Evita muchos casos de SQL Injection.
 *
 * Nota: lo ideal para consultas dinámicas es usar sentencias preparadas (prepared statements).
 *
 * @param string $valor      El valor/cadena a escapar.
 * @param mysqli $connection El objeto/conexión mysqli.
 * @return string            El valor escapado listo para concatenar en SQL.
 */
function escape($valor, $connection) {
    // mysqli_real_escape_string usa la conexión para respetar charset/collation
    return mysqli_real_escape_string($connection, $valor);
}

/**
 * respuestaExito
 * Crea una respuesta JSON estándar para indicar éxito.
 *
 * @param mixed  $data    Datos opcionales (array, objeto, etc).
 * @param string $message Mensaje opcional.
 * @return string         JSON codificado (cadena).
 */
function respuestaExito($data = null, $message = 'OK') {
    return json_encode([
        'success' => true,
        'data' => $data,
        'message' => $message
    ], JSON_UNESCAPED_UNICODE);
}

/**
 * respuestaError
 * Crea una respuesta JSON estándar para indicar error.
 *
 * @param string $message Mensaje de error.
 * @param int    $code    Código de error (por ejemplo 400, 404, 500).
 * @return string         JSON codificado (cadena).
 */
function respuestaError($message = 'Error', $code = 400) {
    return json_encode([
        'success' => false,
        'message' => $message,
        'code' => $code
    ], JSON_UNESCAPED_UNICODE);
}

?>


<?php

/* ===========================
   INTEGRACIÓN AJAX (Frontend jQuery)
   =========================== */

// Llamada AJAX estándar usando jQuery
$.ajax({
    // URL del script en el servidor que procesa la petición
    url: 'server/controlador_citas.php',

    // Método HTTP usado (POST común para enviar datos)
    type: 'POST',

    // Datos que se envían al servidor. Aquí enviamos un "action" y un "filtro".
    data: {
        action: 'obtener_citas',
        filtro: 'algún_valor'
    },

    // Indicamos que esperamos recibir JSON desde el servidor
    dataType: 'json',

    // Función que se ejecuta si la petición HTTP regresa con éxito (código 200)
    success: function(response) {
        // "response" ya fue parseado a objeto JS porque dataType: 'json'
        if (response.success) {
            // Si el servidor indica éxito en su propio JSON, llamamos a la función que renderiza
            renderizarCitas(response.data);
        } else {
            // Si el servidor devolvió success: false, mostramos el mensaje de error que envió
            alert('Error: ' + response.message);
            //Aquí se asume que el servidor devuelve un JSON con un formato tipo:
            //{ "success": true, "data": [ { "nom_cit": "...", "tel_cit":"...", "nom_eje":"..." }, ... ], "message": "OK" }

        }
    },

// Función para renderizar datos en el DOM
function renderizarCitas(citas) {
    var html = '';

    // Recorremos el arreglo de citas (cada cita es un objeto)
    citas.forEach(function(cita) {
        // Concatenamos un bloque por cada cita con nombre, teléfono y ejecutivo
        // OJO: concatenar HTML con datos sin escapar puede producir XSS si los datos vienen sin limpiar
        html += '<div>' + cita.nom_cit + ' - ' + cita.tel_cit + ' (Ejecutivo: ' + cita.nom_eje + ')</div>';
    });

    // Insertamos el HTML generado en el contenedor con id "contenedor-citas"
    $('#contenedor-citas').html(html);
}
 

?>


<?php

/* ===========================
   BACKEND - CONTROLADOR
    Archivo: /server/controlador_citas.php
   
   =========================== */



// Incluye el archivo donde se crea la conexión ($connection) y las funciones helper
include '../inc/conexion.php';

// Indicamos que la respuesta será JSON con codificación UTF-8
header('Content-Type: application/json; charset=utf-8');

// Solo aceptamos peticiones POST
if ($_SERVER['REQUEST_METHOD'] == 'POST') {

    // Tomamos el parámetro action enviado por POST y lo escapamos (prevención básica)
    // Se asume que escape() fue definida en el archivo incluido.
    $action = escape($_POST['action'], $connection);

    // Según el valor de "action" ejecutamos una u otra operación
    switch($action) {

        case 'obtener_citas':
            // Obtenemos el filtro (si existe); si no, cadena vacía
            $filtro = isset($_POST['filtro']) ? escape($_POST['filtro'], $connection) : '';

            // Query para obtener citas y el nombre del ejecutivo (LEFT JOIN porque el ejecutivo puede ser NULL)
            // Se usa LIKE para filtrar por nombre (búsqueda parcial)
            $query = "SELECT c.id_cit, c.nom_cit, c.tel_cit, e.nom_eje 
                      FROM cita c
                      LEFT JOIN ejecutivo e ON c.id_eje2 = e.id_eje
                      WHERE c.nom_cit LIKE '%$filtro%'
                      ORDER BY c.nom_cit ASC";

            // Ejecutamos la consulta con la función helper ejecutarConsulta (devuelve array o false)
            $datos = ejecutarConsulta($query, $connection);

            if($datos !== false) {
                // Si la consulta fue correcta, devolvemos JSON indicando éxito y los datos
                echo respuestaExito($datos, 'Citas obtenidas correctamente');
            } else {
                // Si la consulta falló, devolvemos JSON de error (aquí se incluye el mensaje de mysqli)
                echo respuestaError('Error al consultar citas: ' . mysqli_error($connection) . ' Query: ' . $query);
            }
        break;

        case 'guardar_cita':
            // Obtenemos y escapamos los valores enviados por POST
            $nom_cit = escape($_POST['nom_cit'], $connection);
            $tel_cit = escape($_POST['tel_cit'], $connection);
            $id_eje2 = escape($_POST['id_eje2'], $connection);

            // Query para insertar una nueva cita
            $query = "INSERT INTO cita (nom_cit, tel_cit, id_eje2) 
                      VALUES ('$nom_cit', '$tel_cit', '$id_eje2')";

            // Ejecutamos el INSERT directamente con mysqli_query
            if(mysqli_query($connection, $query)) {
                // En caso de éxito devolvemos el id insertado (mysqli_insert_id)
                echo respuestaExito(['id' => mysqli_insert_id($connection)], 'Cita guardada correctamente');
            } else {
                // En caso de error devolvemos JSON con el mensaje
                echo respuestaError('Error al guardar cita: ' . mysqli_error($connection) . ' Query: ' . $query);
            }
        break;

        default:
            // Acción no reconocida
            echo respuestaError('Acción no válida');
        break;
    }

    // Cerramos la conexión y salimos
    mysqli_close($connection);
    exit;
}
?>
