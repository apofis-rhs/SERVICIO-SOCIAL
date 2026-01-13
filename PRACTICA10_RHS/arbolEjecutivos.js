$(document).ready(function () {
    // Inicializar jsTree
    $('#arbol_ejecutivos').jstree({
        'core': {
            'data': {
                'url': 'obtenerEjecutivosArbol.php',
                'dataType': 'json'
            },
            'check_callback': true, // Permite que el árbol sea editable
            'themes': { 'responsive': false }
        },
        'plugins': ['contextmenu', 'types', 'state'], // Habilitamos clic derecho y estados
        'contextmenu': {
            'items': function (node) {
                return {
                    "Crear": {
                        "label": "Añadir Subordinado",
                        "action": function (obj) {
                            const nuevoNodo = $('#arbol_ejecutivos').jstree('create_node', node);
                            $('#arbol_ejecutivos').jstree('edit', nuevoNodo);
                        }
                    },
                    "Renombrar": {
                        "label": "Cambiar Nombre",
                        "action": function (obj) {
                            $('#arbol_ejecutivos').jstree('edit', node);
                        }
                    },
                    "Eliminar": {
                        "label": "Dar de Baja",
                        "action": function (obj) {
                            if (confirm("¿Estás seguro de eliminar a este ejecutivo?")) {
                                eliminarEjecutivo(node);
                            }
                        }
                    }
                };
            }
        }
    });

    // Cada vez que se edita o se crea de ejecuta la función guardarCambiosArbol(data).
    $('#arbol_ejecutivos').on('rename_node.jstree', function (e, data) {
        guardarCambiosArbol(data);
    });
});