const express = require('express');
const router = express.Router();
const DireccionDespacho = require('../models/DireccionDespacho');

router.post('/', async (req, res) => {
    const usuario_id = req.usuario_id;
    const { 
        etiqueta, 
        rut_receptor, 
        correo_receptor, 
        calle, 
        numero, 
        comuna, 
        region 
    } = req.body;

    if (!calle || !numero || !comuna || !region || !rut_receptor || !correo_receptor || !etiqueta) {
        return res.status(400).json({ message: 'Todos los campos de la dirección son obligatorios.' });
    }

    try {
        
        const count = await DireccionDespacho.countDocuments({ usuario_id });
        const es_principal = count === 0 ? true : false; 

        const nuevaDireccion = new DireccionDespacho({
            usuario_id,
            etiqueta,
            rut_receptor,
            correo_receptor,
            calle,
            numero,
            comuna,
            region,
            es_principal
        });

        const direccionGuardada = await nuevaDireccion.save();
        res.status(201).json({ 
            message: 'Dirección guardada exitosamente.', 
            direccion: direccionGuardada 
        });

    } catch (error) {
        console.error('Error al crear dirección:', error);
        res.status(500).json({ message: 'Error interno del servidor al guardar la dirección.' });
    }
});

router.get('/', async (req, res) => {
    const usuario_id = req.usuario_id;

    try {
        const direcciones = await DireccionDespacho.find({ usuario_id }).sort({ es_principal: -1, _id: 1 });
        
        if (direcciones.length === 0) {
            return res.status(200).json({ message: 'No tienes direcciones guardadas.', direcciones: [] });
        }

        res.status(200).json(direcciones);

    } catch (error) {
        console.error('Error al obtener direcciones:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

router.put('/principal/:id', async (req, res) => {
    const { id } = req.params;
    const usuario_id = req.usuario_id;
    
    try {
        
        await DireccionDespacho.updateMany(
            { usuario_id, es_principal: true },
            { $set: { es_principal: false } }
        );

        
        const direccionPrincipal = await DireccionDespacho.findOneAndUpdate(
            { _id: id, usuario_id },
            { $set: { es_principal: true } },
            { new: true }
        );

        if (!direccionPrincipal) {
            return res.status(404).json({ message: 'Dirección no encontrada.' });
        }

        res.json({ 
            message: 'Dirección establecida como principal.', 
            direccion: direccionPrincipal 
        });

    } catch (error) {
        console.error('Error al establecer dirección principal:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const usuario_id = req.usuario_id;

    try {
        const resultado = await DireccionDespacho.findOneAndDelete({ _id: id, usuario_id });

        if (!resultado) {
            return res.status(404).json({ message: 'Dirección no encontrada o no pertenece al usuario.' });
        }
        
        if (resultado.es_principal) {
            const nuevaPrincipal = await DireccionDespacho.findOneAndUpdate(
                { usuario_id },
                { $set: { es_principal: true } },
                { sort: { _id: 1 }, new: true }
            );
            if(nuevaPrincipal) {
                console.log(`Nueva principal asignada: ${nuevaPrincipal._id}`);
            }
        }

        res.json({ message: 'Dirección eliminada correctamente.' });

    } catch (error) {
        console.error('Error al eliminar dirección:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

module.exports = router;