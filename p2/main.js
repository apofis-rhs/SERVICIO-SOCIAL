$(document).ready(function () {

    // ================================
    // CARGAR TABLA EJECUTIVOS
    // ================================
    function cargarEjecutivos() {
        $.post("listar.php", function (data) {
            $("#tablaDatos").html(data);
        });
    }
    cargarEjecutivos();


    // ================================
    // INSERTAR EJECUTIVO
    // ================================
    $("#formAgregar").submit(function (e) {
        e.preventDefault();

        $.post("insert.php", $(this).serialize(), function (res) {
            if (res.trim() === "OK") {
                cargarEjecutivos();
                $("#formAgregar")[0].reset();
            } else {
                alert("ERROR: " + res);
            }
        });
    });


    // ================================
    // ELIMINAR EJECUTIVO
    // ================================
    $(document).on("click", ".btn-eliminar", function () {
        if (!confirm("¿Eliminar ejecutivo?")) return;

        let id = $(this).data("id");

        $.post("delete.php", { id: id }, function (res) {
            if (res.trim() === "OK") {
                cargarEjecutivos();
            } else {
                alert("ERROR: " + res);
            }
        });
    });


    // ================================
    // CARGAR DATOS PARA EDITAR
    // ================================
    $(document).on("click", ".btn-editar", function () {
        let id = $(this).data("id");

        $.post("obtener.php", { id: id }, function (res) {
            let datos = JSON.parse(res);

            $("#edit_id").val(datos.id_eje);
            $("#edit_nombre").val(datos.nom_eje);
            $("#edit_tel").val(datos.tel_eje);

            $("#modalEditar").modal("show");
        });
    });


    // ================================
    // ACTUALIZAR EJECUTIVO
    // ================================
    $("#btnActualizar").click(function () {
        $.post("update.php", {
            id: $("#edit_id").val(),
            nombre: $("#edit_nombre").val(),
            tel: $("#edit_tel").val()
        }, function (res) {
            if (res.trim() === "OK") {
                $("#modalEditar").modal("hide");
                cargarEjecutivos();
            } else {
                alert("ERROR: " + res);
            }
        });
    });


    // ================================
    // LISTAR CITAS
    // ================================
    function cargarCitas() {
        $.post("citas_listar.php", function (data) {
            $("#tablaCitas").html(data);
        });
    }
    cargarCitas();


    // ================================
    // AGREGAR CITA
    // ================================
    $("#formCita").submit(function (e) {
        e.preventDefault();

        $.post("citas_insertar.php", $(this).serialize(), function (res) {
            if (res.trim() === "OK") {
                cargarCitas();
                $("#formCita")[0].reset();
            } else {
                alert("ERROR: " + res);
            }
        });
    });

});
