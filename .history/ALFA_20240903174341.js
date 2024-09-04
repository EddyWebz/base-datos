const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const connection = require('./database/database');

// Configurar multer para manejar la carga de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'BASE-2/uploads'));
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// Limitar la cantidad de imágenes a 4
const upload = multer({ 
    storage: storage,
    limits: { files: 4 }  // Limitar a un máximo de 4 archivos
});

// Ruta para registrar un nuevo vehículo
router.post('/register', upload.array('image', 4), (req, res) => {
    const user_id = req.session.userId;  // Obtener el user_id de la sesión

    if (!user_id) {
        return res.status(400).json({ success: false, message: 'Usuario no autenticado. Por favor, inicie sesión.' });
    }

    const { datetime, brand, model, clave, plate, color, owner, stayNights, habitacion, garage, observations } = req.body;
    
    // Aquí se incluye la depuración de la ruta de la imagen
    const images = req.files.map(file => {
        const imagePath = `/uploads/${file.filename}`;
        console.log('Ruta de la imagen guardada:', imagePath); // Depuración para verificar la ruta
        return imagePath;
    });

    const imagesJson = JSON.stringify(images);  // Convertir a JSON válido
    console.log('Rutas de las imágenes en JSON:', imagesJson); // Depuración del JSON

    const query = 'INSERT INTO vehiculos (datetime, brand, model, clave, plate, color, owner, stayNights, habitacion, garage, observations, images, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [datetime, brand, model, clave, plate, color, owner, stayNights, habitacion, garage, observations, imagesJson, user_id];
    
    connection.query(query, values, (err, result) => {
        if (err) {
            console.error('Error al insertar en la base de datos:', err);
            return res.status(500).json({ success: false, message: 'Error en el servidor' });
        }

        console.log('Vehículo registrado correctamente con ID:', result.insertId);

        const vehicle = { id: result.insertId, datetime, brand, model, clave, plate, color, owner, stayNights, habitacion, garage, observations, images };
        res.json({ success: true, vehicle });
    });
});

// Ruta para obtener el historial de vehículos
router.get('/history', (req, res) => {
    const user_id = req.session.userId;

    connection.query('SELECT * FROM vehiculos WHERE user_id = ? ORDER BY datetime DESC', [user_id], (err, results) => {
        if (err) {
            console.error('Error al ejecutar la consulta:', err);
            return res.status(500).json({ success: false, message: 'Error en el servidor' });
        }

        const vehicles = results.map(vehicle => {
            vehicle.datetime = new Date(new Date(vehicle.datetime).getTime() + 60 * 60 * 1000);
            
            let images = [];
            try {
                if (typeof vehicle.images === 'string' && vehicle.images.startsWith('[')) {
                    images = JSON.parse(vehicle.images); // Parsear JSON de imágenes
                } else if (vehicle.images) {
                    images = [vehicle.images]; // Tratar como una cadena simple si no es JSON
                }
            } catch (e) {
                console.error('Error al parsear JSON de imágenes:', e);
                images = [vehicle.images]; // Mostrar la imagen como cadena simple en caso de error
            }

            // Asegurarse de que las rutas estén correctamente separadas
            images = images.map(img => img.trim());

            console.log('Imágenes recuperadas para el vehículo:', images);

            return {
                ...vehicle,
                images
            };
        });

        res.json(vehicles);
    });
});

// Ruta para buscar vehículos por nombre o placa
router.get('/search', (req, res) => {
    const user_id = req.session.userId;  // Obtener el user_id de la sesión
    const query = req.query.query;

    console.log('Search query:', query); // Depuración para verificar la consulta de búsqueda

    const sql = 'SELECT * FROM vehiculos WHERE (owner LIKE ? OR plate LIKE ?) AND user_id = ? ORDER BY datetime DESC';
    connection.query(sql, [`%${query}%`, `%${query}%`, user_id], (err, results) => {
        if (err) {
            console.error('Error al ejecutar la consulta:', err);
            return res.status(500).json({ success: false, message: 'Error en el servidor' });
        }

        const vehicles = results.map(vehicle => {
            // Añadir una hora al campo datetime
            vehicle.datetime = new Date(new Date(vehicle.datetime).getTime() + 60 * 60 * 1000);
            
            let images = [];
            try {
                if (typeof vehicle.images === 'string' && vehicle.images.startsWith('[')) {
                    images = JSON.parse(vehicle.images);  // Parsear JSON de imágenes
                } else if (vehicle.images) {
                    images = [vehicle.images];  // Tratar como una cadena simple si no es JSON
                }
            } catch (e) {
                console.error('Error al parsear JSON de imágenes:', e);
                images = [vehicle.images];  // Mostrar la imagen como cadena simple en caso de error
            }
            return {
                ...vehicle,
                images
            };
        });

        res.json(vehicles);
    });
});

// Ruta para obtener datos de un vehículo por placa filtrado por user_id
router.get('/vehicle/:plate', (req, res) => {
    const user_id = req.session.userId;  // Obtener el user_id de la sesión
    const plate = req.params.plate;

    if (!user_id) {
        return res.status(400).json({ success: false, message: 'Usuario no autenticado. Por favor, inicie sesión.' });
    }

    const sql = 'SELECT * FROM vehiculos WHERE plate = ? AND user_id = ?';
    connection.query(sql, [plate, user_id], (err, results) => {
        if (err) {
            console.error('Error al ejecutar la consulta:', err);
            return res.status(500).json({ success: false, message: 'Error en el servidor' });
        }

        if (results.length > 0) {
            // Añadir una hora al campo datetime
            results[0].datetime = new Date(new Date(results[0].datetime).getTime() + 60 * 60 * 1000);
            res.json(results[0]);  // Devolver el primer resultado
        } else {
            res.json({ message: 'No se encontró un vehículo con esa placa' });
        }
    });
});

module.exports = router;
