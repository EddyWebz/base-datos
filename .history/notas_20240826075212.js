const express = require('express');
const router = express.Router();
const pool = require('./database/database-promise');

// Función para calcular la hora de salida basándose en la hora de ingreso y el número de noches
function calcularHoraSalida(horaIngreso, numeroNoches) {
    const fechaHoraIngreso = new Date(horaIngreso);

    let horaSalidaEstimada;

    if (fechaHoraIngreso.getHours() >= 15 || fechaHoraIngreso.getHours() < 7) {
        // Asignar a la noche del mismo día (Regla 1)
        if (fechaHoraIngreso.getHours() < 7) {
            // Si es antes de las 7:00 AM, pertenece a la noche del día anterior
            fechaHoraIngreso.setDate(fechaHoraIngreso.getDate() - 1);
        }
        // La hora de salida se fija a las 12:30 PM del día siguiente después del número de noches
        horaSalidaEstimada = new Date(fechaHoraIngreso.setHours(12, 30, 0, 0));
        horaSalidaEstimada.setDate(horaSalidaEstimada.getDate() + numeroNoches);
    } else if (fechaHoraIngreso.getHours() >= 7 && fechaHoraIngreso.getHours() < 15) {
        // Asignar a la noche del mismo día (Regla 2)
        horaSalidaEstimada = new Date(fechaHoraIngreso.setHours(12, 30, 0, 0));
        horaSalidaEstimada.setDate(horaSalidaEstimada.getDate() + numeroNoches);
    }
 // Añadir noches adicionales (si hay más de una noche)
 horaSalidaEstimada.setDate(horaSalidaEstimada.getDate() + (numeroNoches - 1));

 return horaSalidaEstimada;
}

// Función para obtener la fecha y hora actual del dispositivo
function obtenerFechaHoraActual() {
 return new Date(); // Devuelve la fecha y hora actuales del dispositivo
}

// Función para calcular el ciclo actual de 24 horas basado en la hora del dispositivo
function calcularCicloActual() {
 const now = obtenerFechaHoraActual(); // Hora y fecha actual del dispositivo

 // Calcular el inicio del ciclo (7 AM del día actual)
 const inicioCiclo = new Date(now);
 inicioCiclo.setHours(7, 0, 0, 0); // 7 AM del día actual

 // Calcular el fin del ciclo (7 AM del día siguiente)
 const finCiclo = new Date(inicioCiclo);
 finCiclo.setDate(inicioCiclo.getDate() + 1); // 7 AM del día siguiente

 return { inicioCiclo, finCiclo };
}

// Función para verificar si un vehículo debe mostrarse en las notificaciones según el ciclo actual
function verificarNotificacionVehiculo(horaIngreso) {
 const { inicioCiclo, finCiclo } = calcularCicloActual();
 const fechaHoraIngreso = new Date(horaIngreso); // Convertir datetime de la base de datos a objeto Date

 // Verificar si la hora de ingreso está dentro del ciclo actual
 return fechaHoraIngreso >= inicioCiclo && fechaHoraIngreso < finCiclo;
}

// Ruta para obtener notificaciones activas filtradas por user_id
router.get('/notificaciones', async (req, res) => {
 const user_id = req.session.userId;

 if (!user_id) {
     return res.status(400).json({ success: false, message: 'Usuario no autenticado.' });
 }

 try {
     const [notificaciones] = await pool.query(`
         SELECT habitacion, plate, garage, datetime
         FROM vehiculos
         WHERE user_id = ?
         ORDER BY garage ASC, habitacion ASC
    `, [user_id]);

    const data = {
        P1: [],
        P2: []
    };

    notificaciones.forEach(registro => {
        if (verificarNotificacionVehiculo(registro.datetime)) {
            if (registro.garage === 'P1') {
                data.P1.push({
                    habitacion: registro.habitacion,
                    plate: registro.plate
                });
            } else if (registro.garage === 'P2') {
                data.P2.push({
                    habitacion: registro.habitacion,
                    plate: registro.plate
                });
            }
        }
    });

     console.log('Notificaciones:', data); // Para depuración
    res.json(data);
} catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).send('Error del servidor');
}
});
// Nueva lógica para generar el reporte automático de vehículos en garajes P1 y P2
router.get('/reportes', async (req, res) => {
    const user_id = req.session.userId;

    if (!user_id) {
        return res.status(400).json({ success: false, message: 'Usuario no autenticado.' });
    }

    try {
        const now = obtenerFechaHoraActual(); // Hora actual del dispositivo

        const [reportes] = await pool.query(`
            SELECT habitacion, plate, garage, datetime, stayNights
            FROM vehiculos
            WHERE user_id = ?
            ORDER BY garage ASC, habitacion ASC
        `, [user_id]);

        const data = {
            P1: [],
            P2: []
        };

        reportes.forEach(registro => {
            const horaSalidaEstimada = calcularHoraSalida(registro.datetime, registro.stayNights);

            // Asegurarse de que el vehículo esté en el reporte si la hora actual es menor a la hora de salida
            if (now < horaSalidaEstimada) {
                if (registro.garage === 'P1') {
                    data.P1.push({
                        habitacion: registro.habitacion,
                        plate: registro.plate
                    });
                } else if (registro.garage === 'P2') {
                    data.P2.push({
                        habitacion: registro.habitacion,
                        plate: registro.plate
                    });
                }
            }
        });

        console.log('Reporte Automático:', data); // Para depuración
        res.json(data);
    } catch (error) {
        console.error('Error al generar el reporte:', error);
        res.status(500).send('Error del servidor');
    }
});

module.exports = router;
