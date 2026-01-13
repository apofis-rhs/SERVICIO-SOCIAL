$(document).ready(function () {
    // Inicializar jsTree
    $('#arbol_ejecutivos').jstree({
        'core': {
            'data': {
                'url': 'obtenerEjecutivosArbol.php',
                'dataType': 'json'
            },
            'check_callback': true, // Indispensable para permitir Drag & Drop
            'themes': { 'responsive': false }
        },
        // Configuramos los ICONOS aquí
        'types': {
    'default': { 'icon': 'glyphicon glyphicon-folder-open' },
    'plantel': { 'icon': 'glyphicon glyphicon-home' }, // Casa
    'ejecutivo': { 'icon': 'glyphicon glyphicon-user' } // Persona
},
'plugins': ['contextmenu', 'types', 'state', 'dnd'], // 

        'contextmenu': {
            'items': function (node) {
                // Regla: No se puede borrar ni renombrar un PLANTEL, solo ejecutivos
                if (node.type === 'plantel') {
                    return {
                        "Crear": {
                            "label": "Añadir Ejecutivo Aquí",
                            "action": function (obj) {
                                const nuevoNodo = $('#arbol_ejecutivos').jstree('create_node', node, { type: 'ejecutivo' });
                                $('#arbol_ejecutivos').jstree('edit', nuevoNodo);
                            }
                        }
                    };
                }

                // Menú normal para Ejecutivos
                return {
                    "Crear": {
                        "label": "Añadir Subordinado",
                        "action": function (obj) {
                            const nuevoNodo = $('#arbol_ejecutivos').jstree('create_node', node, { type: 'ejecutivo' });
                            $('#arbol_ejecutivos').jstree('edit', nuevoNodo);
                        }
                    },
                    "Renombrar": {
                        "label": "Cambiar Nombre",
                        "action": function (obj) { $('#arbol_ejecutivos').jstree('edit', node); }
                    },
                    "Eliminar": {
                        "label": "Dar de Baja",
                        "action": function (obj) {
                            if (confirm("¿Estás seguro?")) { eliminarEjecutivo(node); }
                        }
                    }
                };
            }
        }
    });

    // --- EVENTOS ---

    // 1. Al terminar de crear/renombrar
    $('#arbol_ejecutivos').on('rename_node.jstree', function (e, data) {
        guardarCambiosArbol(data);
    });

    // 2. NUEVO: Al arrastrar y soltar (Drag & Drop)
    $('#arbol_ejecutivos').on('move_node.jstree', function (e, data) {
        actualizarPosicionEjecutivo(data);
    });
});

// --- LÓGICA DE ACTUALIZACIÓN DE POSICIÓN ---
function actualizarPosicionEjecutivo(data) {
    var id_ejecutivo = data.node.id;
    var nuevo_padre_id = data.parent;
    
    var id_pla = null;
    var id_padre = null;

    // A. ¿Lo soltaste dentro de un PLANTEL? (El ID empieza con 'P', ej: 'P2')
    if (nuevo_padre_id.toString().indexOf('P') === 0) {
        id_pla = nuevo_padre_id.replace('P', ''); // Quitamos la 'P' para obtener el ID real (2)
        id_padre = 'NULL'; // Ya no tiene jefe persona, responde al plantel
    } 
    // B. ¿Lo soltaste debajo de otro EJECUTIVO?
    else {
        id_padre = nuevo_padre_id;
        id_pla = 'HEREDAR'; // Le decimos al PHP: "Busca el plantel de mi nuevo jefe y pónmelo a mí"
    }

    // Enviamos al servidor
    $.ajax({
        url: 'logicaArbolEjecutivos.php',
        type: 'POST',
        data: {
            accion: 'mover_nodo',
            id_eje: id_ejecutivo,
            id_padre: id_padre,
            id_pla: id_pla
        },
        success: function(response) {
            console.log("Movimiento guardado:", response);
            // Recargamos el árbol para asegurar que los iconos y datos internos se refresquen
            $('#arbol_ejecutivos').jstree(true).refresh();
        }
    });
}