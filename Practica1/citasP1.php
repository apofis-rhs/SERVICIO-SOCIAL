<?php
include 'funcionesBasicas.php';
include 'conexion.php';

// Consultas iniciales (solo para renderizado inicial)
$citas = ejecutarConsulta("
    SELECT c.id_cita, c.nom_cita, e.nom_eje
    FROM cita c
    LEFT JOIN ejecutivo e ON c.id_eje2 = e.id_eje
    ORDER BY c.id_cita DESC
", $connection);

// Tabla de ejecutivos con teléfono
$ejecutivos = ejecutarConsulta("
    SELECT id_eje, nom_eje, telefono
    FROM ejecutivo
    ORDER BY nom_eje ASC
", $connection);
?>

<!-- ... encabezado y tabla de citas igual que antes ... -->

<!-- TABLA EJECUTIVOS -->
<div class="card shadow mb-4">
    <div class="card-header bg-success text-white">
        <h1 class="mb-0">Ejecutivos</h1>
    </div>
    <div class="card-body">
        <h5>Listado de Ejecutivos</h5>
        <div class="table-responsive">
            <table class="table table-striped table-hover">
                <thead class="thead-dark">
                    <tr>
                        <th>ID</th>
                        <th>Nombre del Ejecutivo</th>
                        <th>Teléfono</th>
                    </tr>
                </thead>
                <tbody id="tabla-ejecutivos-body">
                    <?php if ($ejecutivos): ?>
                        <?php foreach ($ejecutivos as $eje): ?>
                            <tr>
                                <td><?= htmlspecialchars($eje['id_eje']) ?></td>
                                <td><?= htmlspecialchars($eje['nom_eje']) ?></td>
                                <td><?= htmlspecialchars($eje['telefono']) ?></td>
                            </tr>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <tr>
                            <td colspan="3" class="text-center text-muted">No hay ejecutivos registrados.</td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>


    <!-- TABLA EJECUTIVOS -->
    <div class="card shadow mb-4">
        <div class="card-header bg-success text-white">
            <h1 class="mb-0">Ejecutivos</h1>
        </div>
        <div class="card-body">
            <h5>Listado de Ejecutivos</h5>
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead class="thead-dark">
                        <tr>
                            <th>ID</th>
                            <th>Nombre del Ejecutivo</th>
                            <th>Telefono</th>
                        </tr>
                    </thead>
                    <tbody id="tabla-ejecutivos-body">
                        <?php if ($ejecutivos): ?>
                            <?php foreach ($ejecutivos as $eje): ?>
                                <tr>
                                    <td><?= htmlspecialchars($eje['id_eje']) ?></td>
                                    <td><?= htmlspecialchars($eje['nom_eje']) ?></td>
                                    <td><?= htmlspecialchars($eje['tel_eje']) ?></td>
                                </tr>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <tr>
                                <td colspan="2" class="text-center text-muted">No hay ejecutivos registrados.</td>
                            </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

</div>

<script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
<script>
// Función para escapar HTML
function escapeHtml(text) {
    var map = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' };
    return String(text).replace(/[&<>\"']/g, m => map[m]);
}

// Función para renderizar citas
function renderizarCitas(citas) {
    let html = '';
    if (!citas || citas.length === 0) {
        html = '<tr><td colspan="3" class="text-center text-muted">No hay citas registradas.</td></tr>';
    } else {
        citas.forEach(c => {
            html += `<tr>
                        <td>${escapeHtml(c.id_cita)}</td>
                        <td>${escapeHtml(c.nom_cita)}</td>
                        <td>${escapeHtml(c.nom_eje)}</td>
                    </tr>`;
        });
    }
    $('#tabla-citas-body').html(html);
}

// Función para renderizar ejecutivos
function renderizarEjecutivos(ejecutivos) {
    let html = '';
    if (!ejecutivos || ejecutivos.length === 0) {
        html = '<tr><td colspan="3" class="text-center text-muted">No hay ejecutivos registrados.</td></tr>';
    } else {
        ejecutivos.forEach(e => {
            html += `<tr>
                        <td>${escapeHtml(e.id_eje)}</td>
                        <td>${escapeHtml(e.nom_eje)}</td>
                        <td>${escapeHtml(e.telefono)}</td>
                    </tr>`;
        });
    }
    $('#tabla-ejecutivos-body').html(html);
}


// AJAX para actualizar tablas
function cargarDatos() {
    $.ajax({
        url: 'controladorCitas.php',
        type: 'POST',
        data: { action: 'obtener_citas' },
        dataType: 'json',
        success: function(response) {
            if (response.success) renderizarCitas(response.data);
        }
    });

    $.ajax({
        url: 'controladorCitas.php',
        type: 'POST',
        data: { action: 'obtener_ejecutivos' },
        dataType: 'json',
        success: function(response) {
            if (response.success) renderizarEjecutivos(response.data);
        }
    });
}

$(document).ready(function() {
    cargarDatos();
});
</script>

</body>
</html>
