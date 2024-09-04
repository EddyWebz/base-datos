const express = require('express');
const router = express.Router();
const pool = require('./database/database-promise');

router.post('/actualizar-garaje', async (req, res) => {
    const { id, nuevoGaraje } = req.body;
    console.log('Datos recibidos en drag-controller:', req.body);

    try {
        const result = await pool.query('UPDATE vehiculos SET garage = ? WHERE id = ?', [nuevoGaraje, id]);

        if (result[0].affectedRows > 0) {
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'No se pudo actualizar el garaje.' });
        }
    } catch (error) {
        console.error('Error al actualizar el garaje:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor.' });
    }
});

module.exports = router;
