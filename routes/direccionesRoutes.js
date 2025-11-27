const express = require('express');
const router = express.Router();
const DireccionDespacho = require('../models/DireccionDespacho'); 

router.get('/', async (req, res) => {
    try {
        
        const direcciones = await DireccionDespacho.find({ usuario_id: req.usuario_id });
        res.json(direcciones);
    } catch (error) {
        console.error('Error al obtener direcciones:', error);
        res.status(500).json({ message: 'Error interno al obtener direcciones.', error: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        
        const nuevaDireccion = new DireccionDespacho({
            ...req.body,
            usuario_id: req.usuario_id 
        });
        
        const direccionGuardada = await nuevaDireccion.save();
        res.status(201).json({ 
            message: 'Dirección guardada con éxito.', 
            direccion: direccionGuardada 
        });
        
    } catch (error) {
        console.error('Error al guardar dirección:', error);

        res.status(400).json({ 
            message: 'Datos incompletos o inválidos para guardar la dirección. Verifique la información.', 
            error: error.message 
        });
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const userId = req.usuario_id; 

    try {
        
        const direccionActualizada = await DireccionDespacho.findOneAndUpdate(
            { _id: id, usuario_id: userId },
            req.body,
            { new: true, runValidators: true } 
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