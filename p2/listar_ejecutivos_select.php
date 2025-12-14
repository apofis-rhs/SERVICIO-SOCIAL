<?php
include "conexion.php";
$res = $connection->query("SELECT id_eje, nom_eje FROM ejecutivo ORDER BY nom_eje");
echo "<option value=''>Seleccione un ejecutivo...</option>";
while($r = $res->fetch_assoc()){
    echo "<option value='{$r['id_eje']}'>".htmlspecialchars($r['nom_eje'],ENT_QUOTES,'UTF-8')."</option>";
}
?>
