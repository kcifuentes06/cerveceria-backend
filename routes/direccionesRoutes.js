// En /routes/direccionesRoutes.js

const express = require('express');
const router = express.Router();
const DireccionDespacho = require('../models/DireccionDespacho'); 

// NOTA: Asumimos que estas rutas están protegidas por 'authMiddleware' en server.js
// y que 'req.usuario_id' es inyectado por el middleware de autenticación.


// =========================================================
// RUTA 1: OBTENER TODAS LAS DIRECCIONES DEL USUARIO (LISTAR)
// GET /api/direcciones 
// =========================================================
router.get('/', async (req, res) => {
    try {
        // Busca todas las direcciones asociadas al usuario logueado (req.usuario_id)
        const direcciones = await DireccionDespacho.find({ usuario_id: req.usuario_id });
        res.json(direcciones);
    } catch (error) {
        console.error('Error al obtener direcciones:', error);
        res.status(500).json({ message: 'Error interno al obtener direcciones.', error: error.message });
    }
});


// =========================================================
// RUTA 2: CREAR UNA NUEVA DIRECCIÓN
// POST /api/direcciones 
// =========================================================
router.post('/', async (req, res) => {
    try {
        // Al usar el spread operator (...req.body), se incluyen todos los campos enviados,
        // incluyendo 'nombre_receptor', 'rut_receptor', 'calle', etc.
        const nuevaDireccion = new DireccionDespacho({
            ...req.body,
            usuario_id: req.usuario_id // Asocia la dirección al ID del usuario logueado
        });
        
        const direccionGuardada = await nuevaDireccion.save();
        res.status(201).json({ 
            message: 'Dirección guardada con éxito.', 
            direccion: direccionGuardada 
        });
        
    } catch (error) {
        console.error('Error al guardar dirección:', error);
        // Si Mongoose falla la validación (por ejemplo, si falta el campo nombre_receptor),
        // devuelve un 400 Bad Request.
        res.status(400).json({ 
            message: 'Datos incompletos o inválidos para guardar la dirección. Verifique la información.', 
            error: error.message 
        });
    }
});


// =========================================================
// RUTA 3: ACTUALIZAR DIRECCIÓN POR ID (OPCIONAL/CRUD COMPLETO)
// PUT /api/direcciones/:id
// =========================================================
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const userId = req.usuario_id; 

    try {
        // Actualiza solo si la dirección pertenece al usuario logueado
        const direccionActualizada = await DireccionDespacho.findOneAndUpdate(
            { _id: id, usuario_id: userId },
            req.body,
            { new: true, runValidators: true } // new: devuelve el documento actualizado; runValidators: valida antes de actualizar
        );

        if (!direccionActualizada) {
            return res.status(404).json({ message: 'Dirección no encontrada o no autorizada.' });
        }

        res.json({ message: 'Dirección actualizada con éxito.', direccion: direccionActualizada });

    } catch (error) {
        console.error('Error al actualizar dirección:', error);
        res.status(400).json({ message: 'Error al actualizar la dirección.', error: error.message });
    }
});


router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const userId = req.usuario_id;

    try {
        
        const direccionEliminada = await DireccionDespacho.findOneAndDelete(
            { _id: id, usuario_id: userId }
        );

        if (!direccionEliminada) {
            return res.status(404).json({ message: 'Dirección no encontrada o no autorizada para eliminar.' });
        }

        res.json({ message: 'Dirección eliminada con éxito.' });

    } catch (error) {
        console.error('Error al eliminar dirección:', error);
        res.status(500).json({ message: 'Error interno al eliminar la dirección.', error: error.message });
    }
});


module.exports = router;