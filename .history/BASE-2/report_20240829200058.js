document.addEventListener('DOMContentLoaded', () => {
    actualizarNotificaciones();
    generarReporteAutomatico(); // Generar el reporte automáticamente al cargar la página

    // Configurar auto-actualización cada 5 minutos para notificaciones y reporte
    setInterval(actualizarNotificaciones,  1 * 60 * 60 * 1000);
    setInterval(generarReporteAutomatico,  1 * 60 * 60 * 1000);

    // Configurar botón de impresión/descarga
    document.getElementById('btn-imprimir').addEventListener('click', imprimirReporte);

    // Redirección al hacer clic en el enlace "Inicio"
    const homeLink = document.getElementById('home-link');
    homeLink.addEventListener('click', () => {
        window.location.href = '/privado/cuerpo.html';
    });

    // Lógica para cerrar sesión
    const logoutButton = document.getElementById('logout-button');
    logoutButton.addEventListener('click', async () => {
        const response = await fetch('/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            window.location.href = '/login'; // Redirigir a la página de inicio de sesión después de cerrar sesión
        } else {
            alert('Error al cerrar sesión. Inténtalo de nuevo.');
        }
    });

    // ---- FUNCIONES DE INTERACCIÓN PARA EL MENÚ ----
    const menuIcon = document.querySelector('.menu-icon');
    const dropdownContent = document.querySelector('.dropdown-content');

    menuIcon.addEventListener('click', () => {
        dropdownContent.classList.toggle('show');
        menuIcon.classList.toggle('open');
    });

    window.addEventListener('click', (e) => {
        if (!menuIcon.contains(e.target) && !dropdownContent.contains(e.target)) {
            dropdownContent.classList.remove('show');
            menuIcon.classList.remove('open');
        }
    });
}); 

// Resto del código...

// Función para obtener y actualizar las notificaciones activas
function actualizarNotificaciones() {
    fetch('/api/notas/notificaciones')
        .then(response => response.json())
        .then(data => {
            console.log('Notificaciones recibidas:', data); // Para depuración

            const contenedorP1 = document.getElementById('notificaciones-contenedor-P1');
            const contenedorP2 = document.getElementById('notificaciones-contenedor-P2');
            contenedorP1.innerHTML = ''; // Limpiar contenido previo
            contenedorP2.innerHTML = ''; // Limpiar contenido previo

            data.P1.forEach(notificacion => {
                const div = document.createElement('div');
                div.classList.add('notificacion');
                div.innerHTML = `<p><strong>Habitación:</strong> ${notificacion.habitacion} <strong>Placa:</strong> ${notificacion.plate}</p>`;
                contenedorP1.appendChild(div);
            });

            data.P2.forEach(notificacion => {
                const div = document.createElement('div');
                div.classList.add('notificacion');
                div.innerHTML = `<p><strong>Habitación:</strong> ${notificacion.habitacion} <strong>Placa:</strong> ${notificacion.plate}</p>`;
                contenedorP2.appendChild(div);
            });
        })
        .catch(error => console.error('Error al obtener notificaciones:', error));
}

// Función para generar y actualizar el reporte automático de vehículos en garaje
function generarReporteAutomatico() {
    fetch('/api/notas/reportes')
        .then(response => response.json())
        .then(data => {
            console.log('Datos del reporte recibidos:', data); // Para depuración

            const tbodyP1 = document.getElementById('tabla-reporte-P1').querySelector('tbody');
            const tbodyP2 = document.getElementById('tabla-reporte-P2').querySelector('tbody');
            tbodyP1.innerHTML = ''; // Limpiar contenido previo
            tbodyP2.innerHTML = ''; // Limpiar contenido previo

            data.P1.forEach(registro => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${registro.habitacion}</td><td>${registro.plate}</td>`;
                tbodyP1.appendChild(tr);
            });

            data.P2.forEach(registro => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${registro.habitacion}</td><td>${registro.plate}</td>`;
                tbodyP2.appendChild(tr);
            });
        })
        .catch(error => console.error('Error al generar el reporte:', error));
}

// Función para imprimir o descargar el reporte como PDF
function imprimirReporte() {
    // Verificar si la página ya ha sido recargada
    if (!window.location.hash) {
        window.location = window.location + '#imprimir';
        window.location.reload();
    } else {
        // Si ya ha sido recargada, procede a imprimir solo la parte del reporte
        const printContents = document.getElementById('Imprimir').innerHTML;
        const originalContents = document.body.innerHTML;

        document.body.innerHTML = printContents;
        window.print();
        document.body.innerHTML = originalContents;

        // Esto es para evitar que la URL tenga el hash #imprimir
        window.history.replaceState('', document.title, window.location.pathname);
    }
}

// Refrescar la página después de cerrar el cuadro de diálogo de impresión
window.addEventListener('afterprint', function() {
    window.location.reload();
});
