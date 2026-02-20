// ==========================================
// 1. VARIABLE SEMÁFORO (GLOBAL) 🚦
// ==========================================
// Esta variable es vital para evitar bucles infinitos entre Socket <-> JS
let ignorarEventosArbol = false; 

// ==========================================
// 2. HELPER VISUAL (FLASH) ✨
// ==========================================
function iluminarNodo(idNodo) {
    var selector = '#' + idNodo + '_anchor';
    var elemento = $(selector);
    
    if (elemento.length > 0) {
        elemento.addClass('jstree-flash');
        setTimeout(function() {
            elemento.removeClass('jstree-flash');
        }, 2000);
    }
}

// ==========================================
// 3. INICIALIZACIÓN (DOCUMENT READY) 🚀
// ==========================================
$(document).ready(function () {
    
    // --- CONFIGURACIÓN JSTREE (Tu lógica original intacta) ---
    $('#arbol_ejecutivos').jstree({
        'core': {
            'data': {
                'url': 'obtenerEjecutivosArbol.php',
                'dataType': 'json'
            },
            'check_callback': true, // Permite editar y mover
            'themes': { 'responsive': false }
        },
        'plugins': ['contextmenu', 'types', 'dnd'], 
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

    // ==========================================
    // 4. EVENTOS DEL ÁRBOL (CON PROTECCIÓN) 🛡️
    // ==========================================

    // Al renombrar (Manual)
    $('#arbol_ejecutivos').on('rename_node.jstree', function (e, data) {
        // 🛑 SEMÁFORO: Si el socket está escribiendo, ignoramos este evento
        if (ignorarEventosArbol) return; 
        
        guardarCambiosArbol(data);
    });

    // Al mover (Manual)
    $('#arbol_ejecutivos').on('move_node.jstree', function (e, data) {
        // 🛑 SEMÁFORO: Si el socket está moviendo, ignoramos este evento
        if (ignorarEventosArbol) return;

        actualizarPosicionEjecutivo(data);
    });

    // --- CLIC EN BADGE MORADO (Equipo/Recursivo) ---
    // (Nota: Tenías este bloque duplicado en tu código, dejé solo una versión corregida)
    $('#arbol_ejecutivos').on('click', '.badge-recursivo', function(e) {
        e.stopPropagation(); // Evita que jstree colapse/expanda al hacer clic en el badge

        var nodoLI = $(this).closest('li');
        var idNodo = nodoLI.attr('id');

        console.log("Clic Morado detectado en nodo:", idNodo);

        ejecutivoSeleccionadoID = idNodo;

        // Selección visual en el árbol
        $('#arbol_ejecutivos').jstree('deselect_all');
        $('#arbol_ejecutivos').jstree('select_node', idNodo);

        // Recarga tabla
        if (typeof cargarCitas === "function") {
            cargarCitas('arbol'); 
        }
    });

    // --- CLIC EN BADGE BLANCO (Individual) ---
    $('#arbol_ejecutivos').on('click', '.badge-propio', function(e) {
        e.stopPropagation();

        var nodoLI = $(this).closest('li');
        var idNodo = nodoLI.attr('id');
        
        // console.log("Clic Blanco detectado en nodo:", idNodo);

        ejecutivoSeleccionadoID = idNodo;

        var arbol = $('#arbol_ejecutivos').jstree(true);
        arbol.deselect_all(true);
        arbol.select_node(idNodo, true);

        if (typeof cargarCitas === "function") {
            cargarCitas('individual');
        }
    });

}); // FIN DOCUMENT READY


// ==========================================
// 5. FUNCIONES AUXILIARES (LOGICA DE NEGOCIO)
// ==========================================

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
        // AVISAR AL SOCKET: ELIMINACIÓN
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
            
            // AVISAR AL SOCKET: CREACIÓN
            if (typeof emitirCambio === "function") {
                emitirCambio('TREE_NEW', {
                    id: res.id,         
                    parent: data.node.parent,
                    text: textoLimpio
                });
            }
        } else { 
            // AVISAR AL SOCKET: RENOMBRAR
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

    $('#arbol_ejecutivos').jstree(true).settings.core.data.url = 
        'obtenerEjecutivosArbol.php?inicio=' + fechaInicio + '&fin=' + fechaFin;
    
    $('#arbol_ejecutivos').jstree(true).refresh();

    if (typeof cargarCitas === "function") {
        cargarCitas();
    }
}


// ==========================================
// 6. RECEPTOR DE SOCKET (CEREBRO) 🧠
// ==========================================
// Función global para que el socketManager la llame
window.procesarEventoArbol = function(mensaje) {
    console.log("🌳 Evento Árbol Recibido:", mensaje.tipo);
    
    var arbol = $('#arbol_ejecutivos').jstree(true);
    var d = mensaje.datos;

    // --- CASO 1: NUEVO EJECUTIVO (CREATE) ---
    if (mensaje.tipo === 'TREE_NEW') {
        if (!arbol.get_node(d.id)) {
            // Creamos nodo. Nota: create_node no dispara rename_node, así que es seguro.
            arbol.create_node(d.parent, {
                id: d.id,
                text: d.text, 
                type: 'ejecutivo'
            });
            
            // Efectos
            setTimeout(() => iluminarNodo(d.id), 100); 
            mostrarToast(`Nuevo ejecutivo agregado: ${d.text}`);
        }
    } 

    // --- CASO 2: RENOMBRAR (UPDATE) - CON PROTECCIÓN ---
    else if (mensaje.tipo === 'TREE_RENAME') {
        var nodo = arbol.get_node(d.id);
        if (nodo) {
            // 🔒 ACTIVAMOS SEMÁFORO
            ignorarEventosArbol = true; 
            
            // HACEMOS EL CAMBIO
            arbol.rename_node(nodo, d.text);
            
            // 🔓 DESACTIVAMOS SEMÁFORO
            ignorarEventosArbol = false;

            // Efectos
            iluminarNodo(d.id);
            mostrarToast(`Ejecutivo renombrado a: ${d.text}`);
        }
    }

    // --- CASO 3: ELIMINAR (DELETE) ---
    else if (mensaje.tipo === 'TREE_DELETE') {
        var nodo = arbol.get_node(d.id);
        if (nodo) {
            arbol.delete_node(nodo);
            mostrarToast(`Ejecutivo eliminado (ID: ${d.id})`);
        }
    }

    // --- CASO 4: MOVER (MOVE) - CON PROTECCIÓN ---
    else if (mensaje.tipo === 'TREE_MOVE') {
        var nodo = arbol.get_node(d.id);
        if (nodo) {
            // 🔒 ACTIVAMOS SEMÁFORO
            ignorarEventosArbol = true;

            arbol.move_node(nodo, d.parent);
            
            // 🔓 DESACTIVAMOS SEMÁFORO
            ignorarEventosArbol = false;
            
            // Efectos
            setTimeout(() => iluminarNodo(d.id), 100);
            mostrarToast(`Ejecutivo movido de posición`);
        }
    }
};