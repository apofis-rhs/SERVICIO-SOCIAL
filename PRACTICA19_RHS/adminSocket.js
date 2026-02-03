// socketManager.js

const WS_URL = 'wss://socket.ahjende.com/wss/?encoding=text';
let socket;

// 1. Inicializar Conexión
function conectarSocket() {
    socket = new WebSocket(WS_URL);

    socket.onopen = () => {
        console.log(" Conectado al WebSocket");
    };

    socket.onmessage = (event) => {
        // Aquí recibimos el mensaje de OTRO usuario
        try {
            const mensaje = JSON.parse(event.data);
            procesarMensajeSocket(mensaje); // Función que crearemos en handsome.js
        } catch (e) {
            console.error("Error al procesar mensaje WS:", e);
        }
    };

    socket.onclose = () => {
        console.warn(" Conexión cerrada. Reintentando en 3s...");
        setTimeout(conectarSocket, 3000); // Reconexión automática
    };
}

// 2. Función para ENVIAR datos (Nosotros -> Mundo)
function emitirCambio(tipo, datos) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        const payload = JSON.stringify({
            tipo: tipo, // 'UPDATE', 'CREATE', 'DELETE'
            datos: datos,
            emisor: 'usuario_actual_id' // Idealmente el ID de sesión PHP
        });
        socket.send(payload);
    }
}

// 3. Función para mostrar el Badge Visual (Feedback)
function mostrarToast(texto) {
    const container = document.getElementById('toast-container') || crearContenedorToast();
    
    const toast = document.createElement('div');
    toast.className = 'toast-exito';
    toast.innerHTML = ` <span>${texto}</span>`;
    
    container.appendChild(toast);
    
    // Animación de entrada
    setTimeout(() => toast.classList.add('mostrar'), 10);

    // Eliminar después de 3 segundos
    setTimeout(() => {
        toast.classList.remove('mostrar');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

function crearContenedorToast() {
    const div = document.createElement('div');
    div.id = 'toast-container';
    document.body.appendChild(div);
    return div;
}

// Iniciar al cargar
document.addEventListener("DOMContentLoaded", conectarSocket);