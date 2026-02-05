$(document).ready(function () {
    // Inicialización Estándar
    $('#arbol_ejecutivos').jstree({
        'core': {
            'data': {
                'url': 'obtenerEjecutivosArbol.php',
                'dataType': 'json'
            },
            'check_callback': true, //con este se puede editar el árbol d and d
            'themes': { 'responsive': false }
        },
        'plugins': ['contextmenu', 'types', 'dnd' /*'state'*/], // habilidades extra: menu, tipos, arrastrar y soltar, estado 
        'types': {
            'default': { 'icon': 'glyphicon glyphicon-folder-open' },
            'plantel': { 'icon': 'glyphicon glyphicon-home' },
            'ejecutivo': { 'icon': 'glyphicon glyphicon-user' }
        },
        'contextmenu': {
            'items': function (node) {
                // Menú para Plantel
                if (node.type === 'plantel') {
                    return {
                        //no se puede borrar ni renombrar un plante   
                        "Crear": {
                            "label": "Añadir Ejecutivo",
                            "action": function (obj) {
                                var n = $('#arbol_ejecutivos').jstree('create_node', node, { type: 'ejecutivo' });
                                $('#arbol_ejecutivos').jstree('edit', n);
                            }
                        }
                    };
                }

                // Menú para Ejecutivos
                return {
                    "Crear": {
                        "label": "Añadir Subordinado",
                        "action": function (obj) {
                            var n = $('#arbol_ejecutivos').jstree('create_node', node, { type: 'ejecutivo' });
                            $('#arbol_ejecutivos').jstree('edit', n);
                        }
                    },
                    "Renombrar": {
                        "label": "Cambiar Nombre",
                        "action": function (obj) { $('#arbol_ejecutivos').jstree('edit', node); }
                    },
                    "Eliminar": {
                        "label": "Dar de Baja",
                        "action": function (obj) {
                            var nombreLimpio = node.text.replace(/🟢|🟡|🔴/g, '').trim();
                            if (confirm("¿Dar de baja a " + nombreLimpio + "?")) eliminarEjecutivo(node);
                        }
                    },
                    "Historial": {
                        "separator_before": true,
                        "label": "Ver Historial",
                        "action": function (obj) {
                            var nombreLimpio = node.text.replace(/🟢|🟡|🔴/g, '').trim();
                            verHistorialEjecutivo(node.id, nombreLimpio);
                        }
                    }
                };
            }
        }
    });

    // Eventos
    $('#arbol_ejecutivos').on('rename_node.jstree', function (e, data) {
        guardarCambiosArbol(data);
    });

    $('#arbol_ejecutivos').on('move_node.jstree', function (e, data) {
        actualizarPosicionEjecutivo(data);
    });

    // 1. Clic en BADGE MORADO (Equipo/Recursivo) 
    $('#arbol_ejecutivos').on('click', '.badge-recursivo', function(e) {
     
        e.stopPropagation();

        var nodoLI = $(this).closest('li');
        var idNodo = nodoLI.attr('id');

        console.log(" Clic Morado detectado en nodo:", idNodo);

       
        ejecutivoSeleccionadoID = idNodo;

        $('#arbol_ejecutivos').jstree('deselect_all');
        $('#arbol_ejecutivos').jstree('select_node', idNodo);

        if (typeof cargarCitas === "function") {
            cargarCitas('arbol'); 
        }
    });

    // 2. Clic en BADGE BLANCO (Individual) 
    $('#arbol_ejecutivos').on('click', '.badge-propio', function(e) {
        var nodoLI = $(this).closest('li');
        var idNodo = nodoLI.attr('id');
        
       // console.log(" Clic Blanco detectado en nodo:", idNodo);

        ejecutivoSeleccionadoID = idNodo;

        var arbol = $('#arbol_ejecutivos').jstree(true);
        arbol.deselect_all(true);
        arbol.select_node(idNodo, true);


        if (typeof cargarCitas === "function") {
            cargarCitas('individual');
        }
    });


   
    // CLIC EN BADGE MORADO 
    $('#arbol_ejecutivos').on('click', '.badge-recursivo', function(e) {
        // 1. Obtener ID del ejecutivo clicado (buscando el <li> padre)
        var nodoLI = $(this).closest('li');
        var idNodo = nodoLI.attr('id');

        // 2. Actualizar la variable global
        ejecutivoSeleccionadoID = idNodo;

        // 3. Pintar el árbol (seleccionar visualmente)
        $('#arbol_ejecutivos').jstree('deselect_all');
        $('#arbol_ejecutivos').jstree('select_node', idNodo);

        // 4. ¡USAR TU LÓGICA EXISTENTE! 
        // Le ordenamos: "Carga citas en modo ARBOL" (igual que el dropdown)
        if (typeof cargarCitas === "function") {
            cargarCitas('arbol'); 
        }
    });

    // CLIC EN BADGE BLANCO 
    $('#arbol_ejecutivos').on('click', '.badge-propio', function(e) {
        var nodoLI = $(this).closest('li');
        var idNodo = nodoLI.attr('id');

        ejecutivoSeleccionadoID = idNodo;

        $('#arbol_ejecutivos').jstree('deselect_all');
        $('#arbol_ejecutivos').jstree('select_node', idNodo);

        // Le ordenamos: "Carga citas en modo INDIVIDUAL"
        if (typeof cargarCitas === "function") {
            cargarCitas('individual'); 
        }
    });
});

// FUNCIONES AUXILIARES 

function actualizarPosicionEjecutivo(data) {
    var id_eje = data.node.id;
    var nuevo_padre = data.parent;
    var id_pla = null, id_padre = null;

    if (nuevo_padre.toString().indexOf('P') === 0) {
        id_pla = nuevo_padre.replace('P', '');
        id_padre = 'NULL';
    } else {
        id_padre = nuevo_padre;
        id_pla = 'HEREDAR';
    }

    $.post('logicaArbolEjecutivos.php', {
        accion: 'mover_nodo',
        id_eje: id_eje,
        id_padre: id_padre,
        id_pla: id_pla
        }, function() {
        // AVISAR AL SOCKET: MOVER
        if (typeof emitirCambio === "function") {
            emitirCambio('TREE_MOVE', {
                id: id_eje,
                parent: nuevo_padre
            });
        }
    });
}

function eliminarEjecutivo(node) {
    $.post('logicaArbolEjecutivos.php', { accion: 'eliminar', id: node.id }, function () {
        $('#arbol_ejecutivos').jstree('delete_node', node);
        //  AVISAR AL SOCKET: ELIMINACIÓN
        if (typeof emitirCambio === "function") {
            emitirCambio('TREE_DELETE', { id: node.id });
        }
    });
}

function guardarCambiosArbol(data) {
    
    var textoLimpio = data.text.replace(/🟢|🟡|🔴/g, '').trim();
    
    $.post('logicaArbolEjecutivos.php', {
        accion: 'crear_o_renombrar',
        id: data.node.id,
        texto: textoLimpio,
        padre: data.node.parent
    }, function (response) {
        var res = JSON.parse(response);
        
        
        if (res.id) {  
                
                // Actualizamos el ID temporal de jstree por el real de la BD
            $('#arbol_ejecutivos').jstree(true).set_id(data.node, res.id);
                
                //  AVISAR AL SOCKET: CREACIÓN
                if (typeof emitirCambio === "function") {
                    emitirCambio('TREE_NEW', {
                        id: res.id,         
                        parent: data.node.parent,
                        text: textoLimpio
                    });
                }

        } else { 
               
                if (typeof emitirCambio === "function") {
                    emitirCambio('TREE_RENAME', {
                        id: data.node.id,    
                        text: textoLimpio
                    });
                }
            }
        
    });
}

function verHistorialEjecutivo(idEje, nombreEje) {
    var modal = document.getElementById('modalHistorial');
    var contenido = document.getElementById('contenidoHistorial');
    
    if(modal) {
        modal.style.display = 'block';
        contenido.innerHTML = 'Cargando...';

        $.getJSON('obtenerHistorialEjecutivo.php', { id_eje: idEje }, function(data) {
            if (!data || data.length === 0) {
                contenido.innerHTML = '<h3>' + nombreEje + '</h3><p>Sin historial registrado.</p>';
                return;
            }
            var html = '<h3>' + nombreEje + '</h3><table border="1" style="width:100%; border-collapse: collapse;"><tr><th>Fecha</th><th>Mov</th><th>Detalle</th></tr>';
            data.forEach(item => {
                html += `<tr><td>${item.fec_his_eje}</td><td>${item.mov_his_eje}</td><td>${item.des_his_eje}</td></tr>`;
            });
            html += '</table>';
            contenido.innerHTML = html;
        });
    }
}


function recargarArbolConFiltros() {
    console.log("¡Filtrando árbol!"); 
    var fechaInicio = document.getElementById('fecha_inicio').value;
    var fechaFin = document.getElementById('fecha_fin').value;

    if(!fechaInicio || !fechaFin) {
        alert("Por favor selecciona ambas fechas");
        return;
    }

    // Recargar el árbol con la nueva URL
    $('#arbol_ejecutivos').jstree(true).settings.core.data.url = 
        'obtenerEjecutivosArbol.php?inicio=' + fechaInicio + '&fin=' + fechaFin;
    
    $('#arbol_ejecutivos').jstree(true).refresh();

    // 2. Recargar Tabla (Lista de Citas) 
    // Solo si ya hay alguien seleccionado, recargamos su tabla
    if (typeof cargarCitas === "function") {
        cargarCitas();
}
}

// Función global para que el socketManager la llame
window.procesarEventoArbol = function(mensaje) {
    console.log("Evento de Árbol Recibido:", mensaje.tipo);
    
    var arbol = $('#arbol_ejecutivos').jstree(true);
    var d = mensaje.datos;

    // Evitamos procesar nuestros propios eventos si rebotan (opcional)
    // Pero jsTree maneja bien esto si el ID ya existe.

    if (mensaje.tipo === 'TREE_NEW') {
        // Verificar si ya existe para no duplicar
        if (!arbol.get_node(d.id)) {
            // Crear nodo visualmente
            arbol.create_node(d.parent, {
                id: d.id,
                text: d.text, // Estructura base
                type: 'ejecutivo'
            });
        }
    } 
    else if (mensaje.tipo === 'TREE_RENAME') {
        var nodo = arbol.get_node(d.id);
        if (nodo) {
            // jsTree es delicado con el HTML en el texto, usamos rename_node
            // pero mantenemos los badges si es posible, o recargamos el nodo
            arbol.rename_node(nodo, d.text); 
            // OJO: Esto borrará los badges momentáneamente hasta recargar, 
            // pero actualiza el nombre base.
        }
    }
    else if (mensaje.tipo === 'TREE_DELETE') {
        var nodo = arbol.get_node(d.id);
        if (nodo) {
            arbol.delete_node(nodo);
        }
    }
    else if (mensaje.tipo === 'TREE_MOVE') {
        var nodo = arbol.get_node(d.id);
        if (nodo) {
            arbol.move_node(nodo, d.parent);
        }
    }
};