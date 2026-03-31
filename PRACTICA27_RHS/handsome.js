const CATALOGO_EFECTIVIDAD = {
    "CITA EFECTIVA": { bg: "#FFC0CB", colorTexto: "#FF0000" }, // Fondo rosa, texto rojo
    "CITA NO EFECTIVA": { bg: "#FF6666", colorTexto: "#FFFFFF" } // Fondo rojo claro, texto blanco
};

const CATALOGO_ESTATUS = {
    "CITA AGENDADA": "#FF9800",
    "INVASIÓN DE CICLO": "#FFFF00",
    "CITA REAGENDADA": "#9C27B0",
    "CITA NO ATENDIDA": "#FF6666",
    "PAGO ESPERADO": "#FF00FF",
    "PERDIDO POR PRECIO": "#AABBCC",
    "PERDIDO POR HORARIO": "#336699",
    "REGISTRO": "#00FFFF",
    "NO LE INTERESA": "#CC0000",
    "ASESORÍA REALIZADA": "#00FF00",
    "CITA CONFIRMADA": "#FFFF00"
};

let mapaColores = {}; // Guardará: { "idCita_nombreColumna": "#065a8e" }
const container = document.querySelector('#handsometable');
let hotInstance = null;
let isAutosaving = false;
let isLoading = false;
let listaEjecutivosGlobal = []; 

// Variable global para recordar a quién le dimos clic
var ejecutivoSeleccionadoID = null;

$(document).ready(function () {
    // 1. Carga inicial (opcional: podrías cargar todo o nada al principio)
    cargarCitas(); 


    // 2. ESCUCHAR CLIC EN EL ÁRBOL (CON GESTIÓN DE PERMISOS 🕋)
    $('#arbol_ejecutivos').on('select_node.jstree', function (e, data) {
        ejecutivoSeleccionadoID = data.node.id;
        var idTexto = String(ejecutivoSeleccionadoID);
        var $selector = $('#filtro_jerarquia');

        // --- FUNCIÓN AUXILIAR: REINICIAR MENÚ ---
        function reiniciarMenu() {
            $selector.empty(); // Limpia
            $selector.append('<option value="individual">👤 Solo este Ejecutivo</option>');
            $selector.append('<option value="arbol">Todo su equipo (Jerárquico)</option>');
            $selector.val('individual'); // Selecciona la primera por defecto
        }

        // --- CASO A: ES UN PLANTEL (P2, P3...) ---
        if (idTexto.indexOf('P') === 0) {
            reiniciarMenu(); // Limpiamos basura anterior
            $selector.val('arbol'); 
            $selector.prop('disabled', true); // Bloqueamos
            cargarCitas(); // Cargamos datos
        } 
        // --- CASO B: ES UN EJECUTIVO (1, 10...) ---
        else {
            $selector.prop('disabled', false); // Desbloqueamos
            reiniciarMenu(); // Ponemos las opciones básicas primero

            // CONSULTAMOS SI TIENE PERMISOS EXTRA (AJAX)
            $.ajax({
                url: 'obtenerPermisos.php',
                type: 'GET',
                data: { id_eje: ejecutivoSeleccionadoID },
                dataType: 'json',
                success: function(permisos) {
                    // Si el PHP nos devuelve datos (como el JSON que me mostraste)
                    if (permisos.length > 0) {
                        // Agregamos una línea separadora visual
                        $selector.append('<option disabled>──────────</option>');
                        
                        // Recorremos cada permiso y creamos la opción
                        permisos.forEach(function(p) {
                            // El valor será especial: "permiso_ID" (ej: permiso_2)
                            $selector.append(`<option value="permiso_${p.id_pla}">🕋 Ver ${p.nombre}</option>`);
                        });
                    }
                    // Cargamos las citas hasta que el menú esté listo
                    cargarCitas();
                },
                error: function() {
                    // Si falla el permiso, al menos cargamos lo básico
                    cargarCitas();
                }
            });
        }
    });

    // 3. ESCUCHAR CAMBIO EN EL FILTRO (Individual vs Árbol)
    $('#filtro_jerarquia').on('change', function() {
        if (ejecutivoSeleccionadoID) {
            cargarCitas();
        }
    });
});



// muestra el horario en la tabla, crea fila vacia  si no hay nada
function generarEstructuraAgenda(citasBD) {
    const horaInicio = 8;
    const horaFin = 20;
    let agendaData = [];
    const fechaHoy = new Date().toISOString().split('T')[0];

    for (let h = horaInicio; h < horaFin; h++) {
        let etiquetaRango = `${h.toString().padStart(2, '0')}:00 - ${(h + 1).toString().padStart(2, '0')}:00`;
        let horaBase = `${h.toString().padStart(2, '0')}:00:00`;

        const citasDelRango = citasBD.filter(c => {
            if (!c.hor_cit) return false;
            let horaCita = parseInt(c.hor_cit.split(':')[0]);
            return horaCita === h;
        });

        if (citasDelRango.length > 0) {
            citasDelRango.forEach(cita => {
                
                
                let nombreVisual = "";
                let ejecutivoEncontrado = listaEjecutivosGlobal.find(e => e.id == cita.id_eje2);
                if (ejecutivoEncontrado) {
                    nombreVisual = ejecutivoEncontrado.label; // 'Juan Perez'
                }

                agendaData.push({
                    rango_fijo: etiquetaRango,
                    id_cit: cita.id_cit,
                    cit_cit: cita.cit_cit,
                    est_cit: cita.est_cit,
                    efe_cit: cita.efe_cit,
                    hor_cit: cita.hor_cit,
                    nom_cit: cita.nom_cit,
                    tel_eje: cita.tel_eje || "",
                    
                    id_eje2: cita.id_eje2,       // GUARDAMOS EL ID (OCULTO)
                    nom_eje_visual: nombreVisual,// GUARDAMOS EL NOMBRE (VISIBLE)
                    
                    comentarios: cita.comentarios
                });
            });
        } else {
           
            agendaData.push({
                rango_fijo: etiquetaRango,
                id_cit: null,
                cit_cit: fechaHoy,
                est_cit: "CITA AGENDADA",
                efe_cit: "",
                hor_cit: horaBase,
                nom_cit: "",
                id_eje2: "",        // ID Vacío
                nom_eje_visual: "",
                tel_eje: "", 
                comentarios: "", 
            });
        }
    }
    return agendaData;
}

// dibuja la tabla, usa el metadata para la estructura, la lista desplegable
// y añade tambien el context menu clic derecho
// Aceptamos el 3er parámetro: comentariosIniciales

function initializeHandsontable(dataCitas, metadata, comentariosIniciales = [], estilosIniciales = []) {
    isLoading = true; 
    const datosEstructurados = generarEstructuraAgenda(dataCitas);

    // 1. PROCESAR ESTILOS INICIALES (Llenamos el mapa)
    mapaColores = {}; 
    if (estilosIniciales && estilosIniciales.length > 0) {
        estilosIniciales.forEach(est => {
            const key = `${est.id_cit}_${est.campo}`;
            mapaColores[key] = est.color;
        });
    }

    if (hotInstance) hotInstance.destroy();

    // 2. CONFIGURACIÓN DE COLUMNAS + RENDERIZADOR DE COLOR
    const colHeaders = metadata.map(col => col.header);
    // ... dentro de initializeHandsontable ...

    const columns = metadata.map(col => {
        const colDef = {
            data: col.data,
            type: col.type,
            readOnly: col.readOnly || false,
            className: col.className || 'htLeft'
        };

        // 1. Configuración de Estatus (Dropdown)
        if (col.data === 'est_cit') {
            colDef.type = 'dropdown';
            colDef.source = Object.keys(CATALOGO_ESTATUS);
        }

        if (col.data === 'efe_cit') {
            colDef.type = 'dropdown';
            colDef.source = Object.keys(CATALOGO_EFECTIVIDAD);
        }

        // 2. Configuración de Ejecutivos
        if (col.header === 'EJECUTIVO') { 
            colDef.data = 'nom_eje_visual'; 
            colDef.source = listaEjecutivosGlobal.map(e => e.label);
            colDef.type = 'dropdown';
        }

        // 3.  EL RENDERER (AQUÍ ESTÁ LA MAGIA DEL COLOR)
        const baseRenderer = Handsontable.renderers.getRenderer(col.type || 'text');

        colDef.renderer = function(instance, td, row, col, prop, value, cellProperties) {
            // A. Pintamos el contenido básico (texto)
            baseRenderer.apply(this, arguments);

            // B.  Lógica de COLOR para ESTATUS
            if (prop === 'est_cit') {
                if (CATALOGO_ESTATUS[value]) {
                    td.style.backgroundColor = CATALOGO_ESTATUS[value];
                    td.style.color = '#000'; // Texto negro para que se lea bien
                    td.style.fontWeight = 'bold';
                } else {
                    // Si está vacío o es nuevo, ponemos el color de "AGENDADA" por defecto
                    td.style.backgroundColor = CATALOGO_ESTATUS["CITA AGENDADA"];
                }
            }

            if (prop === 'efe_cit') {
                if (value && CATALOGO_EFECTIVIDAD[value]) {
                    td.style.backgroundColor = CATALOGO_EFECTIVIDAD[value].bg;
                    td.style.color = CATALOGO_EFECTIVIDAD[value].colorTexto;
                    td.style.fontWeight = 'bold';
                }
            }

            // C. Lógica de Rango Fijo (Horarios)
            if (prop === 'rango_fijo') {
                td.style.fontWeight = 'bold';
                td.style.color = '#c92f2fff';
                td.style.backgroundColor = '#f0f0f0';
                td.style.borderRight = '2px solid #ccc';
            }

            // D. Lógica de Colores Manuales (Sobrescribe todo si existe)
            const rowData = instance.getSourceDataAtRow(row);
            if (rowData && rowData.id_cit) {
                const key = `${rowData.id_cit}_${prop}`;
                if (mapaColores[key]) {
                    td.style.backgroundColor = mapaColores[key];
                }
            }
        };

        return colDef;
    });

    // 3. INICIALIZACIÓN DE HANDSONTABLE
    hotInstance = new Handsontable(container, {
        themeName: 'ht-theme-main',
        data: datosEstructurados,
        colHeaders: colHeaders,
        columns: columns,
        rowHeaders: true,
        licenseKey: 'non-commercial-and-evaluation',
        columnSorting: { indicator: true, sortEmptyCells: true },
        search: true,
        comments: true, 

        // MENÚ CONTEXTUAL (Comentarios + Colores)
        contextMenu: {
            items: {
                // 1. COMENTARIOS
                "commentsAddEdit": { 
                    name: '💬 Agregar/Editar nota',
                    hidden: function() {
                        const sel = this.getSelectedLast();
                        if (!sel) return true;
                        const r = this.getSourceDataAtRow(sel[0]);
                        return !r || !r.id_cit; 
                    }
                },
                "commentsRemove": { 
                    name: '❌ Borrar nota',
                    hidden: function() {
                        const sel = this.getSelectedLast();
                        if (!sel) return true;
                        const r = this.getSourceDataAtRow(sel[0]);
                        return !r || !r.id_cit; 
                    }
                },

                "hsep_color": "---------",

                // 2.  PINTAR CELDA (Estructura Jerárquica Correcta)
                "pintar_celda": {  // <--- ESTE ES EL PADRE
                    name: ' Pintar celda',
                    submenu: {
                        items: [
                            {
                                // EL HIJO DEBE EMPEZAR CON "padre:"
                                key: 'pintar_celda:rojo', 
                                name: '🔴 Urgente (#ffebee)',
                                callback: function(key, selection) { aplicarColor(selection, '#ffebee'); }
                            },
                            {
                                key: 'pintar_celda:verde',
                                name: '🟢 Confirmado (#e8f5e9)',
                                callback: function(key, selection) { aplicarColor(selection, '#e8f5e9'); }
                            },
                            {
                                key: 'pintar_celda:azul',
                                name: '🔵 Pendiente (#e3f2fd)',
                                callback: function(key, selection) { aplicarColor(selection, '#e3f2fd'); }
                            },
                            {
                                key: 'pintar_celda:amarillo',
                                name: '🟡 Atención (#fffde7)',
                                callback: function(key, selection) { aplicarColor(selection, '#fffde7'); }
                            },
                            {
                                key: 'pintar_celda:reset',
                                name: '⚪ Sin color',
                                callback: function(key, selection) { aplicarColor(selection, 'reset'); }
                            }
                        ]
                    },
                    hidden: false // Dejamos visible para probar
                },

                "hsep0": "---------",
                "row_above": {},
                "row_below": {},
                "hsep1": "---------",
                "remove_row": { },
                "hsep2": "---------",
                "ver_historial": {
                    name: 'Ver Historial de Cita',
                    hidden: false, 
                    callback: function(key, selection) {
                        const row = selection[0].start.row;
                        const rowData = this.getSourceDataAtRow(row);
                        if (rowData && rowData.id_cit) {
                            abrirModalHistorial(rowData.id_cit);
                        } else {
                            alert("Fila sin ID.");
                        }
                    }
                },
                "alignment": {}, "copy": {}, "cut": {}
            }
        },

        // --- HOOKS ---
        
        // Bloqueo de seguridad para comentarios
        beforeSetCellMeta: function (row, col, key, value) {
            if (key === 'comment') {
                const rowData = this.getSourceDataAtRow(row);
                if (!rowData || !rowData.id_cit) return false;
            }
        },

        // Guardado de comentarios
        afterSetCellMeta: function (row, col, key, value) {
            if (key === 'comment' && !isAutosaving && !isLoading) {
                const rowData = this.getSourceDataAtRow(row);
                if (!rowData || !rowData.id_cit) return;

                const campo = this.colToProp(col);
                const textoComentario = value ? value.value : '';

                $.post('logicaComentarios.php', {
                    id_cit: rowData.id_cit,
                    campo: campo,
                    comentario: textoComentario
                }, function(resp) {
                    if(resp.status === 'ok') {
                        if (typeof emitirCambio === "function") {
                            emitirCambio('COMMENT_UPDATE', {
                                id_cit: rowData.id_cit,
                                campo: campo,
                                comentario: textoComentario
                            });
                        }
                    }
                }, 'json');
            }
        },

        beforeRemoveRow: function (index, amount, physicalRows, source) {
            if (source === 'SOCKET_UPDATE' || source === 'LOCAL_DELETE') return true; 
            const idsToDelete = [];
            physicalRows.forEach(rowIndex => {
                const rowData = this.getSourceDataAtRow(rowIndex);
                if (rowData && rowData.id_cit) idsToDelete.push(rowData.id_cit);
            });
            if (idsToDelete.length > 0) {
                if (confirm(`¿Estás seguro de eliminar ${idsToDelete.length} registros?`)) {
                    idsToDelete.forEach(id => ajaxEliminarCita(id));
                }
                return false; 
            }
        },

        afterChange: function (changes, source) {
            if (source === 'loadData' || source === 'id_population' || source === 'SOCKET_UPDATE' || source === 'auto_relleno' || !changes) return; 
            const datosActuales = this.getSourceData();
            if (typeof actualizarContadores === 'function') {
                actualizarContadores(datosActuales);
            }
            changes.forEach(([row, prop, oldValue, newValue]) => {
                if (oldValue === newValue) return;
                if (prop === 'nom_eje_visual') {
                    const e = listaEjecutivosGlobal.find(ex => ex.label === newValue);
                    this.setDataAtRowProp(row, 'tel_eje', e ? e.tel : '', 'auto_relleno');
                }

                if (prop === 'est_cit' || prop === 'efe_cit') {
                const colIndex = this.propToCol(prop);
                const td = this.getCell(row, colIndex);
                
                if (td) {
                    // 1. Guardamos el color original (por si acaso)
                    // y forzamos el color "Tenue" de cambio (ej: un gris/azulado muy suave)
                    td.style.transition = "background-color 0.2s ease";
                    td.style.backgroundColor = "#eef4f9"; 
                    
                    // 2. Esperamos 500ms y devolvemos el control al Renderer
                    // para que pinte el color del estatus (Naranja, Rojo...)
                    setTimeout(() => {
                        td.style.backgroundColor = ""; // Quitamos el override
                        this.render(); // Repintamos para que salga el color final
                    }, 500);
                }
            }
                const rowData = this.getSourceDataAtRow(row);
                if (rowData.id_cit) {
                    ajaxActualizarCita(rowData, prop, newValue);
                } else if (prop !== 'rango_fijo' && rowData.nom_cit && rowData.nom_cit.trim() !== '') {
                    ajaxGuardarCita(rowData, row, prop, newValue);
                }
                
            });
        }
        
    });
    if (typeof actualizarContadores === 'function') {
        actualizarContadores(dataCitas);
    }

    // 4. CARGA DE COMENTARIOS INICIALES
    if (comentariosIniciales && comentariosIniciales.length > 0) {
        const pluginComments = hotInstance.getPlugin('comments');
        comentariosIniciales.forEach(c => {
            const r = buscarFilaPorID(c.id_cit);
            const col = hotInstance.propToCol(c.campo);
            if (r !== -1 && col !== -1) {
                pluginComments.setCommentAtCell(r, col, c.comentario);
            }
        });
    }

    hotInstance.render();

    setTimeout(() => { 
        isLoading = false; 
        console.log("✅ Tabla lista (Colores + Comentarios)");
    }, 800);
}


// Función para guardar color, actualizar mapa y avisar por socket
function aplicarColor(selection, colorHex) {
    const row = selection[0].start.row;
    const col = selection[0].start.col;
    const prop = hotInstance.colToProp(col);
    const rowData = hotInstance.getSourceDataAtRow(row);

    if (!rowData || !rowData.id_cit) return;

    // 1. Guardar en BD
    $.post('logicaColor.php', {
        id_cit: rowData.id_cit,
        campo: prop,
        color: colorHex
    }, function(resp) {
        if (resp.status === 'ok') {
            // 2. Actualizar mapa local
            const key = `${rowData.id_cit}_${prop}`;
            if (colorHex === 'reset') {
                delete mapaColores[key];
            } else {
                mapaColores[key] = colorHex;
            }
            
            // 3. Repintar tabla para ver el cambio
            hotInstance.render();
            
            // 4. Emitir Socket
            if (typeof emitirCambio === "function") {
                emitirCambio('COLOR_UPDATE', {
                    id_cit: rowData.id_cit,
                    campo: prop,
                    color: colorHex
                });
            }
            
            mostrarToast(" Estilo actualizado");
        }
    }, 'json');
}



function cargarCitas(modoForzado = null) {
    var modo = (modoForzado !== null) ? modoForzado : $('#filtro_jerarquia').val();
    var fechaInicio = document.getElementById('fecha_inicio').value;
    var fechaFin = document.getElementById('fecha_fin').value;

    console.log(" Cargando citas con Modo:", modo);

    $.ajax({
        url: 'obtenerCitas.php',
        type: 'GET',
        dataType: 'json',
        data: { 
            id_eje: ejecutivoSeleccionadoID, 
            modo: modo, 
            inicio: fechaInicio,
            fin: fechaFin
        },
        success: function (response) {
            if (response && response.data && response.metadata) {
                listaEjecutivosGlobal = response.ejecutivos || [];

                // --- CORRECCIÓN: SOLO UNA LLAMADA ---
                // Pasamos los 4 parámetros: Datos, Metadata, Comentarios y Estilos (Colores)
                initializeHandsontable(
                    response.data, 
                    response.metadata, 
                    response.comentarios || [], 
                    response.estilos || [] // <--- IMPORTANTE: Si no hay estilos, pasamos array vacío
                );
            }
        },
        error: function (xhr, status, error) { console.error("Error:", error); }
    });
    
    if(modoForzado) {
        $('#filtro_jerarquia').val(modoForzado);
    }
}


function prepararDatosParaEnvio(rowData) {
    let idEjecutivoFinal = ''; // Inicializamos vacío (para que SQL guarde NULL si se borra)
    let idPlantelFinal = null;

    // 1. Determinar el Ejecutivo
    if (rowData.nom_eje_visual && rowData.nom_eje_visual.trim() !== "") {
        let e = listaEjecutivosGlobal.find(item => item.label === rowData.nom_eje_visual);
        if (e) idEjecutivoFinal = e.id;
    }

    // 2. Determinar el Plantel (Si estamos en la vista de Plantel)
    if (ejecutivoSeleccionadoID && String(ejecutivoSeleccionadoID).indexOf('P') === 0) {
        idPlantelFinal = String(ejecutivoSeleccionadoID).replace('P', '');
    }

    let datos = {
        id_cit:      rowData.id_cit,
        cit_cit:     rowData.cit_cit,
        hor_cit:     rowData.hor_cit,
        nom_cit:     rowData.nom_cit,
        comentarios: rowData.comentarios,
        id_eje2:     idEjecutivoFinal // Puede ir vacío ''
    };

    // Si sabemos el plantel, lo enviamos para que no se pierda
    if (idPlantelFinal) datos.id_plantel = idPlantelFinal;

    return datos;
}



function ajaxEliminarCita(id) {
    console.log("Eliminando ID:", id);
    
    $.ajax({
        url: 'logicaEliminarCit.php', 
        type: 'POST',
        data: { id_cit: id },
        success: function(response) { 
            console.log("Eliminado:", response);

            const rowIndex = buscarFilaPorID(id);
            if (rowIndex !== -1) {
                hotInstance.alter('remove_row', rowIndex, 1, 'LOCAL_DELETE');
            }

            if (typeof emitirCambio === "function") {
                emitirCambio('DELETE', { id_cit: id });
            }
            
            mostrarToast(`Cita #${id} eliminada`);

            //  Refrescar bolitas al borrar una cita
            actualizarBadgesArbol();
        },
        error: function(xhr) { 
            console.error("Error delete:", xhr.responseText); 
            alert("Error al eliminar la cita. Verifica la consola.");
        }
    });
}

//Se activa cada vez que se cambia cualquier letra o dato en una cita que ya existía.
// AÑADIMOS 'prop' y 'newValue' a los parámetros
function ajaxActualizarCita(rowData, prop, newValue) {
    const datosLimpios = prepararDatosParaEnvio(rowData);
    console.log("Enviando UPDATE limpio:", datosLimpios);

    $.ajax({
        url: 'logicaActualizarCit.php',
        type: 'POST',
        data: datosLimpios,
        success: function (response) {
            console.log('Guardado en BD:', response);

            // 1. Refrescar bolitas SI cambió el dueño de la cita
            if (prop === 'nom_eje_visual') {
                actualizarBadgesArbol(); 
            }

            // 2. Avisar a los demás por Socket
            emitirCambio('UPDATE', {
                id_cit: datosLimpios.id_cit, 
                campo: prop,                 
                valor: newValue,             
                datos_fila: rowData // Mandamos TODA la fila para clonarla si es necesario
            });
            
            // 3. Feedback visual
            mostrarToast("Cambio guardado y notificado");
        },
        error: function (xhr, status, error) {
            console.error('Error al actualizar:', xhr.responseText);
        }
    });
}

//Se activa cuando se escribe en una fila vacía.
//  Al terminar, el servidor le responde con el nuevo ID de la base de datos y 
// la función lo "pega" en la celda oculta de ID para que la fila deje de ser "nueva".
// MODIFICAMOS LA FIRMA PARA RECIBIR 'prop' (columna) y 'value' (valor)
// MODIFICAMOS LA FIRMA PARA RECIBIR 'prop' (columna) y 'value' (valor)
function ajaxGuardarCita(rowData, visualRowIndex, prop, value) {
    isAutosaving = true;
    const datosLimpios = prepararDatosParaEnvio(rowData);
    console.log("Enviando INSERT limpio:", datosLimpios);

    $.ajax({
        url: 'logicaGuardarCit.php',
        type: 'POST',
        data: datosLimpios,
        success: function (response) {
            let nuevoID = parseInt(response) || 0;

            if (nuevoID > 0) {
                hotInstance.setDataAtCell(visualRowIndex, 1, nuevoID, 'id_population');
                rowData.id_cit = nuevoID;
                datosLimpios.id_cit = nuevoID;

                emitirCambio('CREATE', {
                    datos_fila: datosLimpios 
                });

                mostrarToast("Cita creada y notificada");
                
                // ✨ Refrescar bolitas al crear una cita nueva
                actualizarBadgesArbol(); 

            } else {
                console.warn("Se guardó, pero no se recibió un ID válido:", response);
            }
        },
        error: function (xhr) {
            console.error("Error al guardar:", xhr.responseText);
        },
        complete: function () {
            isAutosaving = false;
        }
    });
}

// Inicialización
$(document).ready(function () {
    cargarCitas();

    const inputBuscador = document.getElementById('buscador_agenda');

    if (inputBuscador) {
        inputBuscador.addEventListener('input', function() {
            if (!hotInstance) return;

            const search = hotInstance.getPlugin('search');
            
            const resultados = search.query(this.value);
            
            console.log('Resultados encontrados:', resultados);

       
            hotInstance.render();
    });
}
});

function abrirModalHistorial(idCita) {
    const modal = document.getElementById('modalHistorial');
    const contenido = document.getElementById('contenidoHistorial');
    
    // Mostrar el modal 
    modal.style.display = 'block';
    contenido.innerHTML = 'Cargando registros...';

    $.ajax({
        url: 'obtenerHistorial.php',
        type: 'GET',
        data: { id_cit: idCita },
        success: function(data) {
            if (data.length === 0) {
                contenido.innerHTML = '<p>No se encontraron movimientos para esta cita.</p>';
                return;
            }

            // Generar tabla de historial dentro del modal
            let tabla = `<table border="1" style="width:100%; border-collapse: collapse;">
                <tr style="background: #f2f2f2;">
                    <th>Fecha/Hora</th>
                    <th>Responsable</th>
                    <th>Movimiento</th>
                    <th>Descripción</th>
                </tr>`;
            
            data.forEach(item => {
                tabla += `<tr>
                    <td>${item.fec_his_cit}</td>
                    <td>${item.res_his_cit}</td>
                    <td><strong>${item.mov_his_cit.toUpperCase()}</strong></td>
                    <td>${item.des_his_cit}</td>
                </tr>`;
            });
            tabla += `</table>`;
            contenido.innerHTML = tabla;
        },
        error: function() {
            contenido.innerHTML = 'Error al recuperar el historial.';
        }
    });
}

//Esta función se dispara automáticamente cuando se termina de crear
//  un nuevo nodo o de renombrar uno existente en el árbol.
function guardarCambiosArbol(data) {
    $.ajax({
        url: 'logicaArbolEjecutivos.php',
        type: 'POST',
        data: {
            accion: 'crear_o_renombrar',
            id: data.node.id,
            texto: data.text,
            padre: data.node.parent
        },
        success: function (response) {
            const res = JSON.parse(response);
            if (res.id) {
                // Actualizamos el ID temporal de jsTree con el ID real de la BD
                $('#arbol_ejecutivos').jstree(true).set_id(data.node, res.id);
            }
            // OPCIONAL: Refrescar los dropdowns de Handsontable
            cargarCitas(); 
        }
    });
}

function eliminarEjecutivo(node) {
    $.ajax({
        url: 'logicaArbolEjecutivos.php',
        type: 'POST',
        data: { accion: 'eliminar', id: node.id },
        success: function () {
            $('#arbol_ejecutivos').jstree('delete_node', node);
            cargarCitas(); 
        }
    });
}

// --- FUNCIÓN PARA VER HISTORIAL DE EJECUTIVO  ---
function verHistorialEjecutivo(idEje, nombreEje) {
    // 1. Abrimos el modal existente (reutilizamos el de citas)
    const modal = document.getElementById('modalHistorial');
    const contenido = document.getElementById('contenidoHistorial');
    
    modal.style.display = 'block';
    
    contenido.innerHTML = `<h3>Historial de: ${nombreEje}</h3><p>Cargando datos...</p>`;

    $.ajax({
        url: 'obtenerHistorialEjecutivo.php',
        type: 'GET',
        data: { id_eje: idEje },
        dataType: 'json',
        success: function(data) {
            if (data.length === 0) {
                contenido.innerHTML = `<h3>Historial de: ${nombreEje}</h3><p>No hay movimientos registrados para este ejecutivo.</p>`;
                return;
            }

            let htmlTabla = `<h3>Historial de: ${nombreEje}</h3>
            <table border="1" style="width:100%; border-collapse: collapse; margin-top: 10px;">
                <tr style="background: #e0e0e0;">
                    <th style="padding: 8px;">Fecha</th>
                    <th style="padding: 8px;">Responsable</th>
                    <th style="padding: 8px;">Movimiento</th>
                    <th style="padding: 8px;">Detalle</th>
                </tr>`;

            data.forEach(item => {
                let colorBadge = '#333';
                if(item.mov_his_eje === 'alta') colorBadge = 'green';
                if(item.mov_his_eje === 'baja') colorBadge = 'red';
                if(item.mov_his_eje === 'cambio') colorBadge = 'orange';

                htmlTabla += `
                <tr>
                    <td style="padding: 8px;">${item.fec_his_eje}</td>
                    <td style="padding: 8px;">${item.res_his_eje}</td>
                    <td style="padding: 8px; color: ${colorBadge}; font-weight:bold;">${item.mov_his_eje.toUpperCase()}</td>
                    <td style="padding: 8px;">${item.des_his_eje}</td>
                </tr>`;
            });

            htmlTabla += `</table>`;
            contenido.innerHTML = htmlTabla;
        },
        error: function(xhr) {
            console.error(xhr);
            contenido.innerHTML = `<p style="color:red;">Error al cargar el historial.</p>`;
        }
    });
}

// Función que llama el socketManager cuando llega info
// Función que llama el socketManager cuando llega info
function procesarMensajeSocket(mensaje) {
    const datos = mensaje.datos;

    // 1. Evitar eco (si soy yo mismo, no hago nada)
    if (datos && datos.emisor_id === window.MI_ID_CLIENTE) {
        return; 
    }
    if (!hotInstance) return;

    // =============================================
    // CASO 1: ACTUALIZACIÓN (UPDATE) 
    // =============================================
    if (mensaje.tipo === 'UPDATE') {
        const rowIndex = buscarFilaPorID(datos.id_cit);
        const viendoPlantel = String(ejecutivoSeleccionadoID).indexOf('P') === 0;
        
        // A. LA FILA EXISTE EN MI PANTALLA (Actualizamos o Borramos)
        if (rowIndex !== -1) {
            
            // Inteligencia: ¿Debería desaparecer esta fila de mi vista actual?
            if (datos.campo === 'nom_eje_visual') {
                const e = listaEjecutivosGlobal.find(ex => ex.label === datos.valor);
                const nuevoIdEje = e ? String(e.id) : ''; 
                const modoVista = $('#filtro_jerarquia').val();
                
                if (!viendoPlantel) {
                    if (nuevoIdEje === '') {
                        hotInstance.alter('remove_row', rowIndex, 1, 'SOCKET_UPDATE');
                        mostrarToast(`Cita #${datos.id_cit} regresada al Plantel.`);
                        
                        // ✨ NUEVO: Actualizamos bolitas al perder la cita
                        actualizarBadgesArbol(); 
                        return; 
                    }
                    if (modoVista === 'individual' && nuevoIdEje !== String(ejecutivoSeleccionadoID)) {
                        hotInstance.alter('remove_row', rowIndex, 1, 'SOCKET_UPDATE');
                        mostrarToast(`Cita #${datos.id_cit} reasignada a otro compañero.`);
                        
                        // ✨ NUEVO: Actualizamos bolitas al perder la cita
                        actualizarBadgesArbol(); 
                        return; 
                    }
                }
            }

            // Actualizamos la celda normalmente
            hotInstance.setDataAtRowProp(rowIndex, datos.campo, datos.valor, 'SOCKET_UPDATE');

            // Actualizamos el teléfono si cambió el ejecutivo
            if (datos.campo === 'nom_eje_visual') {
                const e = listaEjecutivosGlobal.find(ex => ex.label === datos.valor);
                hotInstance.setDataAtRowProp(rowIndex, 'tel_eje', e ? e.tel : '', 'SOCKET_UPDATE');
            }

            // Efectos visuales
            if (datos.campo === 'est_cit' || datos.campo === 'efe_cit') {
                hotInstance.render(); 
                const colIndex = hotInstance.propToCol(datos.campo);
                const td = hotInstance.getCell(rowIndex, colIndex);
                if(td) {
                    td.style.transition = "background-color 0.2s";
                    td.style.backgroundColor = '#ffffff'; 
                    setTimeout(() => {
                        td.style.backgroundColor = ""; 
                        hotInstance.render(); 
                    }, 400);
                }
            } else {
                const colIndex = hotInstance.propToCol(datos.campo);
                hotInstance.setCellMeta(rowIndex, colIndex, 'className', 'celda-actualizada');
                hotInstance.render();
            }
        } 
        // B. ✨ LA FILA NO EXISTE EN MI PANTALLA (¿Nueva asignación?) ✨
        else {
            if (datos.campo === 'nom_eje_visual' && datos.datos_fila) {
                const e = listaEjecutivosGlobal.find(ex => ex.label === datos.valor);
                const nuevoIdEje = e ? String(e.id) : '';
                
                // Si me la acaban de asignar a mí (o al ejecutivo que estoy viendo)
                if (!viendoPlantel && nuevoIdEje === String(ejecutivoSeleccionadoID)) {
                    console.log("¡Cita reasignada a mi vista! Inyectando fila con todos sus datos...");
                    
                    const filaDatos = datos.datos_fila;
                    
                    // Insertamos fila vacía arriba
                    hotInstance.alter('insert_row_below', 0, 1, 'SOCKET_UPDATE'); 
                    const nuevaFilaIndex = 0;

                    // ✨ MAGIA DINÁMICA: Recorremos todo el objeto y restauramos TODO
                    Object.keys(filaDatos).forEach(columna => {
                        // Ignoramos propiedades internas que Handsontable crea a veces (empiezan con _)
                        if (!columna.startsWith('_')) {
                            hotInstance.setDataAtRowProp(nuevaFilaIndex, columna, filaDatos[columna], 'SOCKET_UPDATE');
                        }
                    });

                    // Forzamos la actualización de los datos del nuevo ejecutivo para asegurar integridad
                    hotInstance.setDataAtRowProp(nuevaFilaIndex, 'id_eje2', nuevoIdEje, 'SOCKET_UPDATE');
                    hotInstance.setDataAtRowProp(nuevaFilaIndex, 'nom_eje_visual', datos.valor, 'SOCKET_UPDATE');
                    hotInstance.setDataAtRowProp(nuevaFilaIndex, 'tel_eje', e ? e.tel : '', 'SOCKET_UPDATE');

                    // Efecto visual (Flash verde en toda la fila nueva)
                    for(let c=0; c<hotInstance.countCols(); c++) {
                        hotInstance.setCellMeta(nuevaFilaIndex, c, 'className', 'celda-actualizada');
                    }
                    hotInstance.render();
                    
                    mostrarToast(`¡Nueva cita #${filaDatos.id_cit} re-asignada a ti!`);
                }
            }
        }

        //  NUEVO: Actualizar contadores si el socket nos avisa de un cambio de dueño
        if (datos.campo === 'nom_eje_visual') {
            actualizarBadgesArbol();
        }
    }

    // =============================================
    // CASO 2: BAJA (DELETE) 
    // =============================================
    // =============================================
    // CASO 2: BAJA (DELETE) 
    // =============================================
    else if (mensaje.tipo === 'DELETE') {
        const idParaBorrar = mensaje.datos.id_cit;
        const rowIndex = buscarFilaPorID(idParaBorrar);
        
        if (rowIndex !== -1) {
            hotInstance.alter('remove_row', rowIndex, 1, 'SOCKET_UPDATE');
        }

        mostrarToast(`Cita #${idParaBorrar} eliminada remotamente`);
        
        //  NUEVO: Refrescar el árbol en segundo plano para actualizar las bolitas
        actualizarBadgesArbol(); 
    }

    // =============================================
    // CASO 3: ALTA 
    // =============================================
    else if (mensaje.tipo === 'CREATE') {
        const filaDatos = datos.datos_fila;
        let idVistaActual = String(ejecutivoSeleccionadoID); 
        let modoFiltro = $('#filtro_jerarquia').val(); // Para saber si está usando un permiso especial (cubos 🕋)
        
        //  NUEVO: EL CADENERO DEL SOCKET (FILTRO INTELIGENTE) 
        let debeDibujarse = false;

        if (idVistaActual.startsWith('P')) {
            // 1. Si el usuario le dio clic a la de un PLANTEL (ej. P2) en el árbol
            let idPlantelVisto = idVistaActual.replace('P', '');
            if (String(filaDatos.id_plantel) === String(idPlantelVisto)) {
                debeDibujarse = true;
            }
        } 
        else if (modoFiltro && modoFiltro.startsWith('permiso_')) {
            // 2. Si está usando el menú desplegable para ver otro plantel por permiso
            let idPlantelPermiso = modoFiltro.replace('permiso_', '');
            if (String(filaDatos.id_plantel) === String(idPlantelPermiso)) {
                debeDibujarse = true;
            }
        } 
        else {
            // 3. Si el usuario le dio clic a un 👤 EJECUTIVO específico
            if (String(filaDatos.id_eje2) === idVistaActual) {
                debeDibujarse = true;
            }
        }
        //  FIN DE LÓGICA DE FILTRO 
        
        // Solo inyectamos la fila en la tabla si pasó el filtro de seguridad
        if (debeDibujarse) {
             const existe = buscarFilaPorID(filaDatos.id_cit);
             if (existe === -1) {
                hotInstance.alter('insert_row_below', 0, 1, 'SOCKET_UPDATE'); 
                const nuevaFilaIndex = 0;

                // Llenamos los datos visuales
                hotInstance.setDataAtRowProp(nuevaFilaIndex, 'id_cit', filaDatos.id_cit, 'SOCKET_UPDATE');
                hotInstance.setDataAtRowProp(nuevaFilaIndex, 'est_cit', filaDatos.est_cit || "CITA AGENDADA", 'SOCKET_UPDATE'); 
                hotInstance.setDataAtRowProp(nuevaFilaIndex, 'nom_cit', filaDatos.nom_cit, 'SOCKET_UPDATE');
                hotInstance.setDataAtRowProp(nuevaFilaIndex, 'cit_cit', filaDatos.cit_cit, 'SOCKET_UPDATE');
                hotInstance.setDataAtRowProp(nuevaFilaIndex, 'hor_cit', filaDatos.hor_cit, 'SOCKET_UPDATE');
                hotInstance.setDataAtRowProp(nuevaFilaIndex, 'comentarios', filaDatos.comentarios, 'SOCKET_UPDATE');
                
                if(filaDatos.id_eje2) {
                     hotInstance.setDataAtRowProp(nuevaFilaIndex, 'id_eje2', filaDatos.id_eje2, 'SOCKET_UPDATE');
                }
                
                hotInstance.render();

                // Recalcular contadores del embudo de ventas y pastillas de colores
                setTimeout(() => {
                     if (typeof actualizarContadores === 'function') {
                        actualizarContadores(hotInstance.getSourceData());
                     }
                }, 50);
             }
             
             // Y solo mostramos el Toast si la cita le pertenece a la vista actual
             if (typeof mostrarToast === "function") {
                 mostrarToast(`Nueva cita #${filaDatos.id_cit} agregada`);
             }
        }

        //  NUEVO: Refrescamos las bolitas del árbol SIEMPRE que se cree una cita en el sistema
        actualizarBadgesArbol();
    }
    
    // =============================================
    // CASO 4: COMENTARIOS 
    // =============================================
    else if (mensaje.tipo === 'COMMENT_UPDATE') {
        const d = mensaje.datos;
        const rowIndex = buscarFilaPorID(d.id_cit);

        if (rowIndex !== -1 && hotInstance) {
            isAutosaving = true; 
            const colIndex = hotInstance.propToCol(d.campo);
            const pluginComments = hotInstance.getPlugin('comments');
            
            if (d.comentario === '') {
                pluginComments.removeCommentAtCell(rowIndex, colIndex);
            } else {
                pluginComments.setCommentAtCell(rowIndex, colIndex, d.comentario);
            }

            // Efecto visual
            const cellMeta = hotInstance.getCellMeta(rowIndex, colIndex);
            const claseOriginal = cellMeta.className || '';
            const nuevaClase = (claseOriginal + ' celda-comentario-flash').trim();
            hotInstance.setCellMeta(rowIndex, colIndex, 'className', nuevaClase);
            hotInstance.render();

            setTimeout(() => {
                hotInstance.setCellMeta(rowIndex, colIndex, 'className', claseOriginal); 
                hotInstance.render();
            }, 2000);
            isAutosaving = false;
        }
        mostrarToast(`Nota actualizada en cita #${d.id_cit}`);
    }
    
    // =============================================
    // CASO 5: COLOR MANUAL 
    // =============================================
    else if (mensaje.tipo === 'COLOR_UPDATE') {
        const d = mensaje.datos;
        const rowIndex = buscarFilaPorID(d.id_cit);
        const key = `${d.id_cit}_${d.campo}`;
        
        if (d.color === 'reset') {
            delete mapaColores[key];
        } else {
            mapaColores[key] = d.color;
        }

        if (rowIndex !== -1 && hotInstance) {
            hotInstance.render();
            // Efecto
            const colIndex = hotInstance.propToCol(d.campo);
            const td = hotInstance.getCell(rowIndex, colIndex);
            if (td) {
                td.style.transition = "background-color 0.2s";
                td.style.backgroundColor = "#ffffff"; 
                setTimeout(() => {
                    td.style.transition = "background-color 0.8s";
                    td.style.backgroundColor = d.color === 'reset' ? '' : d.color; 
                }, 200);
            }
        }
        mostrarToast(` Estilo actualizado en cita #${d.id_cit}`);
    }
}


// Auxiliar para encontrar la fila visual basada en el ID oculto
function buscarFilaPorID(idBuscado) {
    if (!hotInstance) return -1;

    // Recorremos las filas VISUALES (lo que se ve en pantalla actualmente)
    const totalFilas = hotInstance.countRows();
    
    for (let i = 0; i < totalFilas; i++) {
        // Obtenemos el ID de la fila 'i' usando el nombre de la columna 'id_cit'
        const idFila = hotInstance.getDataAtRowProp(i, 'id_cit');
        
        // Usamos '==' (dos iguales) para que "500" sea igual a 500
        if (idFila == idBuscado) {
            return i; // Retornamos el índice visual para poder borrarlo
        }
    }
    
    return -1; // No encontrado
}

// Auxiliar para pintar la celda
function aplicarEstiloCelda(row, prop) {
    // Aquí usamos setCellMeta para añadir la clase CSS que definimos en el Paso 1
    hotInstance.setCellMeta(row, hotInstance.propToCol(prop), 'className', 'celda-actualizada');
    
    hotInstance.render(); // Refrescar para ver el color
}

// --- FUNCIÓN PARA ACTUALIZAR BARRA DE CONTADORES Y EMBUDO ---
function actualizarContadores(datosTabla) {
    const contenedor = document.getElementById('barra-estatus');
    if (!contenedor) return;
    
    // Contadores para las pastillas de abajo
    const conteos = {};
    const conteosEfectividad = {}; 
    let totalCitas = 0;

    //  VARIABLES NUEVAS PARA EL EMBUDO 
    let funnelEfectivas = 0;
    let funnelRegistros = 0;

    datosTabla.forEach(fila => {
        // Solo contamos si la fila tiene ID (es una cita real)
        if (fila.id_cit) {
            totalCitas++; // Suma al TOTAL DEL EMBUDO

            // 1. Contar Estatus Normales
            const estatus = fila.est_cit || "CITA AGENDADA";
            conteos[estatus] = (conteos[estatus] || 0) + 1;
            
            // ¿Es un REGISTRO? Lo sumamos al embudo
            if (estatus === "REGISTRO") {
                funnelRegistros++;
            }

            // 2. Contar Efectividad
            if (fila.efe_cit && CATALOGO_EFECTIVIDAD[fila.efe_cit]) {
                conteosEfectividad[fila.efe_cit] = (conteosEfectividad[fila.efe_cit] || 0) + 1;
            }

            // ¿Es CITA EFECTIVA? Lo sumamos al embudo
            if (fila.efe_cit === "CITA EFECTIVA") {
                funnelEfectivas++;
            }
        }
    });

    //  ACTUALIZAR EL EMBUDO EN EL HTML
    const domTotal = document.getElementById('funnel-total');
    if (domTotal) {
        // Calcular porcentajes (Regla de 3). 
        // Validamos que totalCitas > 0 para evitar el error de "dividir entre cero"
        let pctEfectivas = totalCitas > 0 ? Math.round((funnelEfectivas / totalCitas) * 100) : 0;
        let pctRegistros = totalCitas > 0 ? Math.round((funnelRegistros / totalCitas) * 100) : 0;

        // Inyectar los textos en las tarjetas
        domTotal.innerText = totalCitas;
        
        document.getElementById('funnel-efectivas').innerText = funnelEfectivas;
        document.getElementById('funnel-efectivas-pct').innerText = `(${pctEfectivas}%)`;
        
        document.getElementById('funnel-registros').innerText = funnelRegistros;
        document.getElementById('funnel-registros-pct').innerText = `(${pctRegistros}%)`;
    }


    //  ACTUALIZAR LA BARRA DE PASTILLAS (LO QUE YA TENÍAS)
    contenedor.innerHTML = ''; 

    if (totalCitas === 0) {
        contenedor.innerHTML = '<span style="color: #777;">Sin citas en este rango.</span>';
        return;
    }

    // Dibujar pastillas de ESTATUS
    Object.keys(CATALOGO_ESTATUS).forEach(key => {
        if (conteos[key]) { 
            const badge = document.createElement('div');
            badge.style.cssText = `background-color: ${CATALOGO_ESTATUS[key]}; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 11px; color: #333; box-shadow: 1px 1px 2px rgba(0,0,0,0.2); border: 1px solid rgba(0,0,0,0.1); display: flex; align-items: center; gap: 5px;`;
            badge.innerHTML = `${key} <span style="background: white; padding: 0px 6px; border-radius: 10px; font-size: 10px;">${conteos[key]}</span>`;
            contenedor.appendChild(badge);
        }
    });

    // Dibujar pastillas de EFECTIVIDAD
    Object.keys(CATALOGO_EFECTIVIDAD).forEach(key => {
        if (conteosEfectividad[key]) { 
            const config = CATALOGO_EFECTIVIDAD[key];
            const badge = document.createElement('div');
            badge.style.cssText = `background-color: ${config.bg}; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 11px; color: ${config.colorTexto}; box-shadow: 1px 1px 2px rgba(0,0,0,0.2); border: 1px solid rgba(0,0,0,0.1); display: flex; align-items: center; gap: 5px; margin-left: 10px; border: 1px solid ${config.colorTexto}`;
            badge.innerHTML = `${key} <span style="background: ${config.colorTexto}; color: ${config.bg}; padding: 0px 6px; border-radius: 10px; font-size: 10px;">${conteosEfectividad[key]}</span>`;
            contenedor.appendChild(badge);
        }
    });
}


// Variable global para controlar las recargas
let timerBadgesArbol = null;

// Función para actualizar las bolitas en tiempo real
function actualizarBadgesArbol() {
    if (timerBadgesArbol) clearTimeout(timerBadgesArbol);
    
    timerBadgesArbol = setTimeout(() => {
        const arbol = $('#arbol_ejecutivos').jstree(true);
        if (arbol) {
            console.log("🔄 Recargando contadores del organigrama en 2do plano...");
            // refresh() recarga el JSON desde PHP sin cerrar las carpetas abiertas
            arbol.refresh(); 
        }
    }, 500); 
}