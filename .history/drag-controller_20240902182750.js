const express = require('express');
const router = express.Router();
const pool = require('./database/database-promise');

router.post('/', async (req, res) => {  // Agregué async aquí
    const { id, newGarage } = req.body;

    try {
        const [result] = await pool.query('UPDATE vehiculos SET garage = ? WHERE id = ?', [newGarage, id]);

        if (result.affectedRows > 0) {
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'No se pudo actualizar el garage.' });
        }
    } catch (error) {
        console.error('Error al actualizar el garage:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor.' });
    }
});

module.exports = router;
