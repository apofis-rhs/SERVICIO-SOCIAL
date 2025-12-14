<?php
include "conexion.php";

$sql = "SELECT * FROM ejecutivo ORDER BY id_eje DESC";
$result = $connection->query($sql);

if (!$result) {
    echo "<tr><td colspan='4'>Error: " . $connection->error . "</td></tr>";
    exit;
}

if ($result->num_rows === 0) {
    echo "<tr><td colspan='4'>No hay ejecutivos registrados</td></tr>";
    exit;
}

while ($row = $result->fetch_assoc()) {
    echo "
    <tr>
        <td>{$row['id_eje']}</td>
        <td>".htmlspecialchars($row['nom_eje'], ENT_QUOTES, 'UTF-8')."</td>
        <td>".htmlspecialchars($row['tel_eje'], ENT_QUOTES, 'UTF-8')."</td>
        <td>
            <button class='btn btn-secondary btn-sm rounded-pill btn-editar' data-id='{$row['id_eje']}'>Editar</button>
            <button class='btn btn-danger btn-sm rounded-pill btn-eliminar' data-id='{$row['id_eje']}'>Eliminar</button>
        </td>
    </tr>
    ";
}
?>
