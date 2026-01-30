const container = document.querySelector('#handsometable');
let hotInstance = null;
let isAutosaving = false;
let listaEjecutivosGlobal = []; 

// Variable global para recordar a quién le dimos clic
var ejecutivoSeleccionadoID = null;

$(document).ready(function () {
    // 1. Carga inicial (opcional: podrías cargar todo o nada al principio)
    cargarCitas(); 

    // 2. ESCUCHAR CLIC EN EL ÁRBOL (Esta es la clave)

    // 2. ESCUCHAR CLIC EN EL ÁRBOL (CON GESTIÓN DE PERMISOS 🕋)
    $('#arbol_ejecutivos').on('select_node.jstree', function (e, data) {
        ejecutivoSeleccionadoID = data.node.id;
        var idTexto = String(ejecutivoSeleccionadoID);
        var $selector = $('#filtro_jerarquia');

        // --- FUNCIÓN AUXILIAR: REINICIAR MENÚ ---
        // Borra todo y pone las opciones "de fábrica"
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
function initializeHandsontable(dataCitas, metadata) {
    
    // 1. Preprocesar los datos para la Agenda
    const datosEstructurados = generarEstructuraAgenda(dataCitas);
    
    if (hotInstance) {
        hotInstance.destroy();
    }

    // 2. CONSTRUCCIÓN DINÁMICA: Mapeamos 
    const colHeaders = metadata.map(col => col.header);
    
    const columns = metadata.map(col => {
    
        const colDef = {
            data: col.data,
            type: col.type,
            readOnly: col.readOnly || false,
            className: col.className || 'htLeft'
        };

        
        if (col.dateFormat) colDef.dateFormat = col.dateFormat;
        if (col.timeFormat) colDef.timeFormat = col.timeFormat;

        // --- LÓGICA PARA LA COLUMNA EJECUTIVO ---
        if (col.header === 'EJECUTIVO') { 
            // 1. CAMBIAMOS EL 'DATA' PARA QUE LEA EL NOMBRE VISUAL, NO EL ID
            colDef.data = 'nom_eje_visual'; 
            
            // 2. OBTENEMOS LA LISTA DE NOMBRES PARA EL SELECT
            colDef.source = listaEjecutivosGlobal.map(e => e.label);
            
            colDef.type = 'dropdown';
        }
        
        // Aplicamos el Renderer especial a la columna 'rango_fijo'
        if (col.data === 'rango_fijo') {
            colDef.renderer = function (instance, td, row, col, prop, value, cellProperties) {
                Handsontable.renderers.TextRenderer.apply(this, arguments);
                td.style.fontWeight = 'bold';
                td.style.color = '#c92f2fff';
                td.style.backgroundColor = '#f0f0f0';
                td.style.borderRight = '2px solid #ccc';
            };
            colDef.width = 120;
        }

        return colDef;
    });

    // 3. Inicialización de Handsontable
    hotInstance = new Handsontable(container, {
        themeName: 'ht-theme-main',
        data: datosEstructurados,
        
        
        colHeaders: colHeaders,
        columns: columns,
        
        rowHeaders: true,
       contextMenu: {
    items: {
        "row_above": {},
        "row_below": {},
        "hsep1": "---------",
        "remove_row": { },
        "hsep2": "---------",
        "ver_historial": {
            name: 'Ver Historial de Cita',
            callback: function(key, selection) {
                const row = selection[0].start.row;
                const rowData = this.getSourceDataAtRow(row);
                
                // Solo abrir si la fila tiene un ID (es una cita guardada)
                if (rowData && rowData.id_cit) {
                    abrirModalHistorial(rowData.id_cit);
                } else {
                    alert("Esta fila no tiene movimientos registrados aún.");
                }
            }
        },
        "alignment": {},
        "copy": {},
        "cut": {}
    }
},
        licenseKey: 'non-commercial-and-evaluation',
        columnSorting: {
            indicator: true,
            sortEmptyCells: true

        
        },
        search: true,

       
        
        beforeRemoveRow: function (index, amount, physicalRows) {
            const idsToDelete = [];
            physicalRows.forEach(rowIndex => {
                const rowData = this.getSourceDataAtRow(rowIndex);
                if (rowData && rowData.id_cit) {
                    idsToDelete.push(rowData.id_cit);
                }
            });

            if (idsToDelete.length > 0) {
                const confirmacion = confirm(`¿Estás seguro de eliminar ${idsToDelete.length} registros?`);
                if (!confirmacion) {
                    return false;
                }
                idsToDelete.forEach(id => {
                    ajaxEliminarCita(id);
                });
            }
        },

        // aqui es un escuchador, se activa cada vez que se edita o crea una cita
        afterChange: function (changes, source) {
            if (source === 'loadData' || source === 'id_population' || !changes) {
                return;
            }

            changes.forEach(([row, prop, oldValue, newValue]) => {
                if (oldValue === newValue) return;
                
                if (prop === 'nom_eje_visual') {
                    // 1. Buscamos al ejecutivo en nuestra lista global
                    const ejecutivoEncontrado = listaEjecutivosGlobal.find(e => e.label === newValue);
                    
                    if (ejecutivoEncontrado) {
                        // 2. "Pegamos" el teléfono en la columna 'tel_eje'
                        // Usamos 'setDataAtRowProp' que es la forma segura de editar por nombre de columna
                        // El último parámetro 'auto_relleno' es una etiqueta para evitar bucles infinitos
                        this.setDataAtRowProp(row, 'tel_eje', ejecutivoEncontrado.tel, 'auto_relleno');
                    } else {
                        // Si borraron el nombre, borramos el teléfono
                        this.setDataAtRowProp(row, 'tel_eje', '', 'auto_relleno');
                    }
                }
                // ------------------------------------------------

                const rowData = this.getSourceDataAtRow(row);

                // Lógica de Guardado (Tu código existente)
                if (rowData.id_cit) {
                    ajaxActualizarCita(rowData);
                } else {
                    if (prop !== 'rango_fijo' && rowData.nom_cit && rowData.nom_cit.trim() !== '') {
                        ajaxGuardarCita(rowData, row); 
                    }
                }
            });
        }
       
    });
}


function cargarCitas(modoForzado = null) {
    
  
    var modo = (modoForzado !== null) ? modoForzado : $('#filtro_jerarquia').val();

    
    var fechaInicio = document.getElementById('fecha_inicio').value;
    var fechaFin = document.getElementById('fecha_fin').value;

    console.log("🚀 Cargando citas con Modo:", modo); // Para verificar en consola

    $.ajax({
        url: 'obtenerCitas.php', // Tu PHP que ya funciona
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
                initializeHandsontable(response.data, response.metadata);
            }
        },
        error: function (xhr, status, error) { console.error("Error:", error); }
    });
    
    if(modoForzado) {
        $('#filtro_jerarquia').val(modoForzado);
    }
}


function prepararDatosParaEnvio(rowData) {
    
    let idEjecutivoFinal = null;
    
    if (rowData.nom_eje_visual && rowData.nom_eje_visual.trim() !== "") {
        let e = listaEjecutivosGlobal.find(item => item.label === rowData.nom_eje_visual);
        if (e) {
            idEjecutivoFinal = e.id;
        }
    } else {
        idEjecutivoFinal = ""; 
    }

    
    return {
        id_cit:      rowData.id_cit,
        cit_cit:     rowData.cit_cit,
        hor_cit:     rowData.hor_cit,
        nom_cit:     rowData.nom_cit,
        comentarios: rowData.comentarios,
        id_eje2:     idEjecutivoFinal 
    };
}

function ajaxEliminarCita(id) {
    console.log("Eliminando ID:", id);
    $.ajax({
        url: 'logicaEliminarCit.php', 
        type: 'POST',
        data: { id_cit: id },
        success: function(response) { console.log("Eliminado:", response); },
        error: function(xhr) { console.error("Error delete:", xhr.responseText); }
    });
}

//Se activa cada vez que se cambia cualquier letra o dato en una cita que ya existía.
function ajaxActualizarCita(rowData) {
    // 1. Usamos la función para limpiar los datos antes de enviar
    const datosLimpios = prepararDatosParaEnvio(rowData);

    console.log("Enviando UPDATE limpio:", datosLimpios);

    $.ajax({
        url: 'logicaActualizarCit.php',
        type: 'POST',
        data: datosLimpios, // <--- Enviamos el objeto limpio
        success: function (response) {
            console.log('Actualización exitosa:', response);
        },
        error: function (xhr, status, error) {
            console.error('Error al actualizar:', xhr.responseText);
        }
    });
}

//Se activa cuando se escribe en una fila vacía.
//  Al terminar, el servidor le responde con el nuevo ID de la base de datos y 
// la función lo "pega" en la celda oculta de ID para que la fila deje de ser "nueva".
function ajaxGuardarCita(rowData, visualRowIndex) {
    isAutosaving = true;
    
    // 1. Usamos la función para limpiar los datos antes de enviar
    const datosLimpios = prepararDatosParaEnvio(rowData);

    console.log("Enviando INSERT limpio:", datosLimpios);

    $.ajax({
        url: 'logicaGuardarCit.php',
        type: 'POST',
        data: datosLimpios, // <--- Enviamos el objeto limpio
        success: function (response) {
            // Asumimos que el PHP devuelve el nuevo ID (ej: "15")
            let nuevoID = parseInt(response) || 0;
            
            if (nuevoID > 0) {
               
                hotInstance.setDataAtCell(visualRowIndex, 1, nuevoID, 'id_population'); 
                console.log('Creado con ID:', nuevoID);
                
                // Actualizamos también el id interno de la fila para futuros updates
                rowData.id_cit = nuevoID;
            } else {
                console.warn("Se guardó, pero no se recibió un ID válido:", response);
            }
        },
        error: function(xhr) {
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

//Esta función se ejecuta cuando el usuario confirma que desea
//  "Dar de baja" a un ejecutivo desde el menú de clic derecho.
function eliminarEjecutivo(node) {
    $.ajax({
        url: 'logicaArbolEjecutivos.php',
        type: 'POST',
        data: { accion: 'eliminar', id: node.id },
        success: function () {
            $('#arbol_ejecutivos').jstree('delete_node', node);
            cargarCitas(); // Refrescar tabla para quitar al ejecutivo de las opciones
        }
    });
}

// --- FUNCIÓN PARA VER HISTORIAL DE EJECUTIVO  ---
function verHistorialEjecutivo(idEje, nombreEje) {
    // 1. Abrimos el modal existente (reutilizamos el de citas)
    const modal = document.getElementById('modalHistorial');
    const contenido = document.getElementById('contenidoHistorial');
    
    modal.style.display = 'block';
    
    // Ponemos un título temporal
    contenido.innerHTML = `<h3>Historial de: ${nombreEje}</h3><p>Cargando datos...</p>`;

    // 2. Pedimos los datos al PHP nuevo
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

            // 3. Construimos la tabla HTML
            let htmlTabla = `<h3>Historial de: ${nombreEje}</h3>
            <table border="1" style="width:100%; border-collapse: collapse; margin-top: 10px;">
                <tr style="background: #e0e0e0;">
                    <th style="padding: 8px;">Fecha</th>
                    <th style="padding: 8px;">Responsable</th>
                    <th style="padding: 8px;">Movimiento</th>
                    <th style="padding: 8px;">Detalle</th>
                </tr>`;

            data.forEach(item => {
                // Definimos color según movimiento para que se vea pro
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