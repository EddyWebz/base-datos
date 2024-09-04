const express = require('express');
const bcrypt = require('bcrypt');
const connection = require('./database/database');
const path = require('path');
const session = require('express-session');
const alfaRoutes = require('./ALFA');
const notasRoutes = require('./notas');
const cron = require('node-cron'); // Importar cron

const app = express(); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de la sesión
app.use(session({
    secret: 'c7b226554f4666a11164ac960f8f807b140116defe512e297e73d1b04a043231',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // Duración de la cookie: 24 horas
    }
}));

// Servir archivos estáticos desde la carpeta 'BASE-2'
app.use(express.static(path.join(__dirname, 'BASE-2')));
app.use('/uploads', express.static(path.join(__dirname, 'BASE-2/uploads')));

// Middleware para verificar si el usuario está autenticado
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    } else {
        res.redirect('/login');
    }
}

// Proteger la ruta a cuerpo.html
app.get('/privado/cuerpo.html', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'privado', 'cuerpo.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'BASE-2', 'index.html'));
});

app.get('/privado/report.html', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'privado', 'report.html'));
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM usuarios WHERE email = ?';

    connection.query(sql, [email], (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            bcrypt.compare(password, results[0].password, (err, isMatch) => {
                if (err) throw err;
                if (isMatch) {
                    req.session.userId = results[0].id;
                    console.log('User ID stored in session:', req.session.userId);
                    res.status(200).json({ success: true, userId: results[0].id });
                } else {
                    res.status(401).send('Contraseña incorrecta');
                }
            });
        } else {
            res.status(404).send('Usuario no encontrado');
        }
    });
});

app.post('/register', (req, res) => {
    const { nombre, email, password } = req.body;
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) throw err;
        const sql = 'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)';
        connection.query(sql, [nombre, email, hashedPassword], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).send('El correo ya está registrado');
                }
                throw err;
            }
            const userId = result.insertId;
            req.session.userId = userId;
            res.status(201).json({ success: true, userId });
        });
    });
});

// Integración de las rutas
app.use('/api', alfaRoutes);
app.use('/api/notas', notasRoutes);

// Cron job que se ejecuta a las 7:00 AM todos los días
cron.schedule('0 7 * * *', () => {
    const { reiniciarCicloNotificaciones } = require('./notas'); // Importar la función del archivo notas
    console.log('Ejecutando cron job de reinicio a las 7:00 AM...');
    reiniciarCicloNotificaciones();
});

// Ruta para cerrar sesión
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error al cerrar sesión' });
        }
        res.clearCookie('connect.sid'); // Eliminar la cookie de sesión
        return res.status(200).json({ success: true, message: 'Sesión cerrada exitosamente' });
    });
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
