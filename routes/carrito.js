
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); 
const ItemCarrito = require('../models/ItemCarrito');
const Producto = require('../models/Producto');


router.get('/', auth, async (req, res) => {
    try {
        
        const items = await ItemCarrito.find({ usuario_id: req.usuario.id });
        
        let subtotal = 0;
        
        
        items.forEach(item => {
            subtotal += item.precio_unitario * item.cantidad;
        });

        res.json({
            items: items,
            subtotal: subtotal.toFixed(2) 
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el servidor al obtener el carrito');
    }
});


router.post('/items', auth, async (req, res) => {
    const { producto_id, cantidad = 1 } = req.body;
    try {
        
        const producto = await Producto.findById(producto_id);
        if (!producto) {
            return res.status(404).json({ msg: 'Producto no encontrado' });
        }
        
        
        let item = await ItemCarrito.findOne({ 
            usuario_id: req.usuario.id, 
            producto_id 
        });

        if (item) {
            
            item.cantidad += parseInt(cantidad);
            await item.save();
        } else {
            
            item = new ItemCarrito({
                usuario_id: req.usuario.id,
                producto_id,
                cantidad: parseInt(cantidad),
                nombre_producto: producto.nombre,
                precio_unitario: producto.precio 
            });
            await item.save();
        }

        res.json(item);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el servidor al agregar al carrito');
    }
});


router.patch('/items/:id_item', auth, async (req, res) => {
    const { cantidad } = req.body;
    try {
        
        const item = await ItemCarrito.findOneAndUpdate(
            { _id: req.params.id_item, usuario_id: req.usuario.id }, 
            { $set: { cantidad: parseInt(cantidad) } }, 
            { new: true } 
        );

        if (!item) {
            return res.status(404).json({ msg: 'Ítem no encontrado en el carrito' });
        }

        
        if (item.cantidad <= 0) {
            await ItemCarrito.findByIdAndDelete(req.params.id_item);
            return res.json({ msg: 'Ítem eliminado del carrito', item: null });
        }

        res.json(item);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el servidor al actualizar el carrito');
    }
});

router.delete('/items/:id_item', auth, async (req, res) => {
    try {
        
        const item = await ItemCarrito.findOneAndDelete({ 
            _id: req.params.id_item, 
            usuario_id: req.usuario.id 
        });

        if (!item) {
            return res.status(404).json({ msg: 'Ítem no encontrado o no pertenece al usuario' });
        }

        res.json({ msg: 'Ítem eliminado con éxito' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el servidor al eliminar el ítem');
    }
});

module.exports = router;