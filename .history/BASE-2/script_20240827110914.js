document.addEventListener('DOMContentLoaded', () => {
    // ---- CONFIGURACIÓN INICIAL ----
    function setDateTime() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const localDatetime = `${year}-${month}-${day}T${hours}:${minutes}`;
        document.getElementById('datetime').value = localDatetime;
    }

    // Establecer la fecha y hora inicial en el campo 'datetime' cuando se carga la página
    setDateTime();

    // ---- VARIABLES ----
    const vehicleForm = document.getElementById('vehicleForm');
    const historyContent = document.getElementById('historyContent');
    const historyCards = document.getElementById('historyCards');
    const toggleHistoryBtn = document.getElementById('toggleHistoryBtn');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const searchResults = document.getElementById('searchResults');
    const imageInput = document.getElementById('image'); // Campo de imágenes

    // ---- COMPRESIÓN DE IMÁGENES AL SELECCIONAR ----
    imageInput.addEventListener('change', async (e) => {
        const files = [...e.target.files]; // Obtener las imágenes seleccionadas
        const compressedFiles = [];

        for (let file of files) {
            // Crear una promesa para cada imagen comprimida
            const compressedFile = await new Promise((resolve, reject) => {
                new Compressor(file, {
                    quality: 0.6, // Ajusta la calidad de la imagen al 60%
                    success(result) {
                        // Convertir Blob a File
                        const newFile = new File([result], file.name, {
                            type: file.type,
                            lastModified: Date.now(),
                        });
                        resolve(newFile); // Imagen comprimida (reducción de calidad)
                    },
                    error(err) {
                        console.error('Error al comprimir la imagen:', err);
                        reject(err);
                    },
                });
            });
            compressedFiles.push(compressedFile); // Añadir la imagen comprimida a la lista
        }

        // Aquí reemplazamos los archivos seleccionados por los comprimidos
        const dataTransfer = new DataTransfer();
        compressedFiles.forEach(file => {
            dataTransfer.items.add(file); // Añadir las imágenes comprimidas al DataTransfer
        });

        e.target.files = dataTransfer.files; // Reemplazar los archivos en el input con los comprimidos
        console.log('Imágenes comprimidas y listas para enviar:', e.target.files);
    });

    // ---- CONVERTIR TEXTO A MAYÚSCULAS ----
    const textFields = [
        document.getElementById('brand'),
        document.getElementById('model'),
        document.getElementById('clave'),
        document.getElementById('plate'),
        document.getElementById('color'),
        document.getElementById('owner')
    ];

    // Añadir el evento input para convertir a mayúsculas en tiempo real
    textFields.forEach(field => {
        field.addEventListener('input', () => {
            field.value = field.value.toUpperCase();
        });
    });

    // ---- LIMITE DE IMÁGENES A 4 ----
    imageInput.addEventListener('change', () => {
        if (imageInput.files.length > 4) {
            alert('Solo puedes subir un máximo de 4 imágenes.');
            imageInput.value = '';  // Vaciar la selección
        }
    });

    // ---- FUNCIONES DE FORMATEO ----
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    }

    // ---- FUNCIONES PARA MANEJAR EL HISTORIAL ----
    function addVehicleToHistory(vehicle) {
        const card = document.createElement('div');
        card.className = 'history-card';

        for (let key in vehicle) {
            if (vehicle.hasOwnProperty(key) && key !== 'images' && key !== 'user_id' && key !== 'id' && key !== 'created_at') {
                const div = document.createElement('div');
                let value = vehicle[key];
                // Formato de fechas
                if (key === 'datetime') {
                    value = formatDate(value);
                }
                // Formatear el nombre de la clave 
                const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                div.textContent = `${formattedKey}: ${value}`;
                card.appendChild(div);
            }
        }

        // Manejo de imágenes (nueva función refactorizada)
        handleVehicleImages(vehicle, card);

        historyCards.appendChild(card);
    }

    // ---- FUNCIONES DE MANEJO DE IMÁGENES ----
    function createImageElement(image) {
        const img = document.createElement('img');
        img.src = image;
        img.alt = 'Imagen del vehículo';
        img.addEventListener('click', () => showFullscreenImage(image));
        return img;
    }

    function showFullscreenImage(image) {
        const fullscreenImg = document.createElement('img');
        fullscreenImg.src = image;
        fullscreenImg.className = 'fullscreen-img';
        fullscreenImg.addEventListener('click', () => {
            document.body.removeChild(fullscreenImg);
        });
        document.body.appendChild(fullscreenImg);
    }

    function handleVehicleImages(vehicle, card) {
        if (vehicle.images && Array.isArray(vehicle.images)) {
            vehicle.images.forEach(image => {
                const img = createImageElement(image);
                card.appendChild(img);
            });
        } else if (vehicle.images && typeof vehicle.images === 'string') {
            try {
                const imagesArray = JSON.parse(vehicle.images);
                imagesArray.forEach(image => {
                    const img = createImageElement(image);
                    card.appendChild(img);
                });
            } catch (error) {
                console.error('Error al parsear vehicle.images:', error);
            }
        }
    }

    // Cargar el historial desde el backend (todos los resultados)
    async function loadHistory() {
        const response = await fetch('/api/history');
        const vehicles = await response.json();

        console.log('Vehicles fetched:', vehicles); // Depuración
        historyContent.style.display = 'block';
        historyCards.innerHTML = ''; // Limpiar historial antes de cargar nuevos resultados
        vehicles.forEach(addVehicleToHistory); // Mostrar del más reciente al más antiguo
    }

    // ---- FUNCIONES PARA MANEJAR EL FORMULARIO DE REGISTRO ----
    vehicleForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitButton = document.querySelector('button[type="submit"]');
        submitButton.disabled = true; // Deshabilitar el botón inmediatamente

        const loadingMessage = document.createElement('p');
        loadingMessage.textContent = 'Cargando...';
        vehicleForm.appendChild(loadingMessage); // Mostrar mensaje de cargando

        const formData = new FormData(vehicleForm);
        const response = await fetch('/api/register', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();
        if (result.success) {
            addVehicleToHistory(result.vehicle);
            vehicleForm.reset();

            // Repoblar el campo de fecha y hora después de registrar un vehículo
            setDateTime();

            loadingMessage.textContent = 'Registro exitoso';
            setTimeout(() => {
                loadingMessage.remove(); // Eliminar el mensaje después de 1 segundo
                submitButton.disabled = false; // Habilitar el botón para permitir nuevos registros si es necesario
            }, 1000);
        } else {
            alert(result.message || 'Error al registrar vehículo');
            submitButton.disabled = false; // Habilitar el botón si hay un error
            loadingMessage.remove(); // Eliminar el mensaje de cargando si hay un error
        }
    });

    // ---- FUNCIONES DE BÚSQUEDA ----
    searchButton.addEventListener('click', async () => {
        const query = searchInput.value.trim();
        console.log('Search query sent:', query); // Depuración
        if (!query) return;
        const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
        const vehicles = await response.json();
        console.log('Vehicles received:', vehicles); // Depuración
        searchResults.style.display = 'block';
        searchResults.innerHTML = ''; // Limpiar resultados de búsqueda anteriores
        if (vehicles.length === 0) {
            searchResults.innerHTML = '<p>No se encontraron resultados.</p>';
        } else {
            vehicles.forEach(vehicle => {
                const card = document.createElement('div');
                card.className = 'history-card';

                // Mostrar todos los detalles del vehículo
                card.innerHTML = `
                    <div>Fecha hora: ${new Date(vehicle.datetime).toLocaleString()}</div>
                    <div>Marca: ${vehicle.brand}</div>
                    <div>Modelo: ${vehicle.model}</div>
                    <div>Clave: ${vehicle.clave}</div>
                    <div>Placa: ${vehicle.plate}</div>
                    <div>Color: ${vehicle.color}</div>
                    <div>Propietario: ${vehicle.owner}</div>
                    <div>Estancias: ${vehicle.stayNights}</div>
                    <div>Habitación: ${vehicle.habitacion}</div>
                    <div>Garaje: ${vehicle.garage}</div>
                    <div>Observaciones: ${vehicle.observations}</div>
                `;

                // Manejo de imágenes (nueva función refactorizada)
                handleVehicleImages(vehicle, card);

                searchResults.appendChild(card);
            });
        }
    });

    // ---- FUNCIONES PARA MANEJAR EL HISTORIAL ----
    toggleHistoryBtn.addEventListener('click', () => {
        if (historyContent.style.display === 'none') {
            loadHistory();
        } else {
            historyContent.style.display = 'none';
        }
    });

    // ---- FUNCIONES DE INTERACCIÓN ----
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

    // ---- AUTOCOMPLETAR CAMPOS AL INGRESAR PLACA ----
    const plateInput = document.getElementById('plate'); // Campo de placa

    plateInput.addEventListener('input', async () => {
        const plate = plateInput.value.trim();
        if (plate.length > 0) { // Solo busca si hay algo en el campo de placa
            const response = await fetch(`/api/vehicle/${encodeURIComponent(plate)}`);
            const vehicle = await response.json();

            if (vehicle && !vehicle.message) {
                // Auto rellenar campos en español
                document.getElementById('brand').value = vehicle.brand || '';
                document.getElementById('model').value = vehicle.model || '';
                document.getElementById('clave').value = vehicle.clave || '';
                document.getElementById('color').value = vehicle.color || '';
                document.getElementById('owner').value = vehicle.owner || '';
            }
        }
    });

    // ---- Redirección al hacer clic en el submenú de notificaciones ----
    const submenuNotificaciones = document.querySelector('.dropdown-content');

    submenuNotificaciones.addEventListener('click', () => {
        window.location.href = '/privado/report.html';
    });

    // ---- Lógica para cerrar sesión ----
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
});
