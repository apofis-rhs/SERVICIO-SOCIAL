// ==========================================
// 1. VARIABLES GLOBALES
// ==========================================
let ignorarEventosArbol = false; // Semáforo

// ==========================================
// 2. EFECTOS VISUALES (MAGIA ✨)
// ==========================================

// A. Flash de Color (Fondo)
function iluminarNodo(idNodo) {
    var selector = '#' + idNodo + '_anchor'; // jstree usa _anchor para el texto
    var elemento = $(selector);
    
    if (elemento.length > 0) {
        elemento.addClass('jstree-flash'); // Clase CSS de animación
        setTimeout(() => elemento.removeClass('jstree-flash'), 2000);
    }
}

// B. Badge de Éxito (Icono ✅ temporal)
function mostrarBadgeExito(idNodo) {
    var selector = '#' + idNodo + '_anchor';
    var elemento = $(selector);

    if (elemento.length > 0) {
        // Evitamos duplicados si ya tiene uno
        if (elemento.find('.badge-exito-temp').length === 0) {
            var badge = $('<span class="badge-exito-temp" style="margin-left:8px; color:green; font-weight:bold;">✅</span>');
            elemento.append(badge);
            
            // Desaparece solito a los 3 segundos
            setTimeout(() => badge.fadeOut(500, () => badge.remove()), 3000);
        }
    }
}

// ==========================================
// 3. RECEPCIÓN DE SOCKET (CEREBRO 🧠)
// ==========================================
window.procesarEventoArbol = function(mensaje) {
    console.log("🌳 Evento Árbol Recibido:", mensaje.tipo);
    
    var arbol = $('#arbol_ejecutivos').jstree(true);
    if (!arbol) return;

    var d = mensaje.datos;

    // --- CASO 1: NUEVO EJECUTIVO ---
    if (mensaje.tipo === 'TREE_NEW') {
        if (!arbol.get_node(d.id)) {
            arbol.create_node(d.parent, { id: d.id, text: d.text, type: 'ejecutivo' });
            
            setTimeout(() => {
                iluminarNodo(d.id);
                mostrarBadgeExito(d.id); // <--- BADGE ✅
                mostrarToast(`Nuevo ejecutivo: ${d.text}`);
            }, 200);
        }
    } 
    // --- CASO 2: RENOMBRAR ---
    else if (mensaje.tipo === 'TREE_RENAME') {
        var nodo = arbol.get_node(d.id);
        if (nodo) {
            ignorarEventosArbol = true; // 🔒 Bloqueamos
            arbol.rename_node(nodo, d.text);
            ignorarEventosArbol = false; // 🔓 Desbloqueamos

            iluminarNodo(d.id);
            mostrarBadgeExito(d.id); // <--- BADGE ✅
            mostrarToast(`Renombrado a: ${d.text}`);
        }
    }
    // --- CASO 3: MOVER ---
    else if (mensaje.tipo === 'TREE_MOVE') {
        var nodo = arbol.get_node(d.id);
        if (nodo) {
            ignorarEventosArbol = true; 
            arbol.move_node(nodo, d.parent);
            ignorarEventosArbol = false; 

            iluminarNodo(d.id);
            mostrarBadgeExito(d.id); 
            mostrarToast(`Ejecutivo movido`);
        }
    }
    // --- CASO 4: ELIMINAR ---
    else if (mensaje.tipo === 'TREE_DELETE') {
        var nodo = arbol.get_node(d.id);
        if (nodo) {
            arbol.delete_node(nodo);
            mostrarToast(`Ejecutivo eliminado`);
        }
    }
};

// ==========================================
// 4. INICIALIZACIÓN
// ==========================================
$(document).ready(function () {
    
    $('#arbol_ejecutivos').jstree({
        'core': {
            'data': { 'url': 'obtenerEjecutivosArbol.php', 'dataType': 'json' },
            'check_callback': true,
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
                // Aquí va tu lógica de menú contextual original
                // (Para abreviar, usa la misma estructura que tenías antes)
                return generarMenuContextual(node); 
            }
        }
    });

    // --- EVENTOS LOCALES ---
    
    // 1. Renombrar / Crear
    $('#arbol_ejecutivos').on('rename_node.jstree', function (e, data) {
        if (ignorarEventosArbol) return; 
        guardarCambiosArbol(data);
    });

    // 2. Mover
    $('#arbol_ejecutivos').on('move_node.jstree', function (e, data) {
        if (ignorarEventosArbol) return;
        actualizarPosicionEjecutivo(data);
    });

    // 3. Clics en Badges
    $('#arbol_ejecutivos').on('click', '.badge-propio', function(e) {
        e.stopPropagation();
        seleccionarEjecutivo($(this).closest('li').attr('id'), 'individual');
    });

    $('#arbol_ejecutivos').on('click', '.badge-recursivo', function(e) {
        e.stopPropagation();
        seleccionarEjecutivo($(this).closest('li').attr('id'), 'arbol');
    });
});

// ==========================================
// 5. FUNCIONES AUXILIARES
// ==========================================

// ... (Aquí van tus funciones generarMenuContextual, eliminarEjecutivo, etc.)
// ... (Asegúrate de pegar la función guardarCambiosArbol corregida abajo) ...

function guardarCambiosArbol(data) {
    // Limpiamos los emojis viejos del texto que viene del input
    var textoLimpio = data.text.replace(/🟢|🟡|🔴|🕋/g, '').trim(); 
    
    console.log("🚀 Intentando guardar:", textoLimpio, "ID:", data.node.id);

    $.post('logicaArbolEjecutivos.php', {
        accion: 'crear_o_renombrar',
        id: data.node.id,
        texto: textoLimpio,
        padre: data.node.parent
    }, function (response) {
        
        console.log("📩 Respuesta RAW del servidor:", response);

        var res = response;
        if (typeof response === 'string') {
            try {
                res = JSON.parse(response);
            } catch (e) {
                console.error("❌ Error parseando JSON:", e);
                return;
            }
        }
        
        // SI TENEMOS ID (La clave del éxito)
        if (res.id) { 
            console.log("✅ Guardado exitoso. ID Confirmado:", res.id);

            // 1. Actualizar ID en jstree (por si era nuevo)
            var arbol = $('#arbol_ejecutivos').jstree(true);
            arbol.set_id(data.node, res.id);

            // 2. TRUCO: Como al renombrar se pierden los badges, refrescamos el nodo
            // Esto vuelve a llamar a obtenerEjecutivosArbol.php solo para este nodo (o el árbol)
            arbol.refresh(); 

            // 3. Emitir Socket
            var esNuevo = String(data.node.id).startsWith('j');
            var tipoEvento = esNuevo ? 'TREE_NEW' : 'TREE_RENAME';

            if (typeof emitirCambio === "function") {
                emitirCambio(tipoEvento, {
                    id: res.id,        
                    parent: data.node.parent,
                    text: textoLimpio
                });
            }

            // 4. Feedback Visual
            mostrarBadgeExito(res.id); // Check verde
            iluminarNodo(res.id);      // Flash
            mostrarToast("Cambio guardado: " + textoLimpio);

        } else if (res.error) {
            alert("Error del servidor: " + res.error);
        }
    }).fail(function(xhr) {
        console.error("❌ Fallo crítico en AJAX:", xhr.responseText);
    });
}

function actualizarPosicionEjecutivo(data) {
    // ... (Tu lógica original de mover nodo) ...
    // Al final del success:
    if (typeof emitirCambio === "function") {
        emitirCambio('TREE_MOVE', { id: data.node.id, parent: data.parent });
    }
    mostrarBadgeExito(data.node.id); // Feedback local
}

function seleccionarEjecutivo(id, modo) {
    ejecutivoSeleccionadoID = id;
    var arbol = $('#arbol_ejecutivos').jstree(true);
    arbol.deselect_all(true);
    arbol.select_node(id, true);
    $('#filtro_jerarquia').val(modo);
    if (typeof cargarCitas === "function") cargarCitas(modo);
}