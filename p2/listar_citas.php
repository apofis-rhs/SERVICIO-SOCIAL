<?php
include "conexion.php";
$sql = "SELECT c.id_cit, c.nom_cit, e.nom_eje, e.tel_eje
        FROM cita c
        LEFT JOIN ejecutivo e ON c.id_eje2 = e.id_eje
        ORDER BY c.id_cit DESC";
$res = $connection->query($sql);
if (!$res) { echo "<tr><td colspan='4'>Error: ".$connection->error."</td></tr>"; exit; }
if ($res->num_rows === 0) { echo "<tr><td colspan='4'>No hay citas</td></tr>"; exit; }
while ($r = $res->fetch_assoc()) {
    $ej = htmlspecialchars($r['nom_eje'] ?? '—', ENT_QUOTES,'UTF-8');
    $tel = htmlspecialchars($r['tel_eje'] ?? '—', ENT_QUOTES,'UTF-8');
    echo "
    <tr>
      <td>{$r['id_cit']}</td>
      <td>".htmlspecialchars($r['nom_cit'], ENT_QUOTES,'UTF-8')."</td>
      <td>{$ej}</td>
      <td>{$tel}</td>
      <td>
         <button class='btn btn-secondary btn-sm rounded-pill btn-editar-cita' data-id='{$r['id_cit']}'>Editar</button>
         <button class='btn btn-danger btn-sm rounded-pill btn-eliminar-cita' data-id='{$r['id_cit']}'>Eliminar</button>
      </td>
    </tr>";
}
?>
