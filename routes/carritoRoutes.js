const express = require('express');
const router = express.Router();
const ItemCarrito = require('../models/ItemCarrito'); 

router.get('/', async (req, res) => {
    try {
        const items = await ItemCarrito.find({ usuario_id: req.usuario_id }).populate('producto_id');
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener el carrito.', error: err.message });
    }
});

router.post('/', async (req, res) => {
    const { producto_id, nombre_producto, precio_unitario, cantidad = 1 } = req.body;
    const usuario_id = req.usuario_id; 

    try {
        let item = await ItemCarrito.findOne({ usuario_id, producto_id });

        if (item) {
            
            item.cantidad += cantidad;
            await item.save();
        } else {
            item = new ItemCarrito({
                usuario_id,
                producto_id,
                nombre_producto,
                precio_unitario,
                cantidad
            });
            await item.save();
        }

        res.status(200).json({ message: 'Producto agregado al carrito.', item });

    } catch (err) {
        res.status(500).json({ message: 'Error al agregar producto al carrito.', error: err.message });
    }
});

router.put('/:itemId', async (req, res) => {
    const { cantidad } = req.body;
    const { itemId } = req.params;

    if (cantidad <= 0) {
        return res.status(400).json({ message: 'La cantidad debe ser positiva. Usa DELETE para eliminar.' });
    }

    try {
        const item = await ItemCarrito.findOneAndUpdate(
            { _id: itemId, usuario_id: req.usuario_id },
            { cantidad },
            { new: true }
        );

        if (!item) {
            return res.status(404).json({ message: 'Ítem no encontrado en el carrito.' });
        }

        res.json({ message: 'Cantidad actualizada.', item });
    } catch (err) {
        res.status(500).json({ message: 'Error al actualizar cantidad.', error: err.message });
    }
});


router.delete('/:itemId', async (req, res) => {
    try {
        const result = await ItemCarrito.findOneAndDelete({ _id: req.params.itemId, usuario_id: req.usuario_id });

        if (!result) {
            return res.status(404).json({ message: 'Ítem no encontrado en el carrito.' });
        }

        res.json({ message: 'Ítem eliminado del carrito con éxito.' });
    } catch (err) {
        res.status(500).json({ message: 'Error al eliminar ítem.', error: err.message });
    }
});

module.exports = router;