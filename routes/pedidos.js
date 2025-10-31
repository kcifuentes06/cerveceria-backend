const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const DireccionDespacho = require('../models/DireccionDespacho');
const ItemCarrito = require('../models/ItemCarrito');
const Producto = require('../models/Producto');
const Pedido = require('../models/Pedido');
const DetallePedido = require('../models/DetallePedido');

router.get('/direcciones', auth, async (req, res) => {
    try {
        const direcciones = await DireccionDespacho.find({ usuario_id: req.usuario.id });
        res.json(direcciones);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error al obtener direcciones');
    }
});


router.post('/direcciones', auth, async (req, res) => {
    const { etiqueta, rut_receptor, correo_receptor, calle, numero, comuna, region } = req.body;
    try {
        const nuevaDireccion = new DireccionDespacho({
            usuario_id: req.usuario.id,
            etiqueta,
            rut_receptor,
            correo_receptor,
            calle,
            numero,
            comuna,
            region
        });
        await nuevaDireccion.save();
        res.status(201).json(nuevaDireccion);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error al guardar la dirección');
    }
});

router.post('/checkout', auth, async (req, res) => {
    const { direccion_id } = req.body;
    try {
        
        const itemsCarrito = await ItemCarrito.find({ usuario_id: req.usuario.id });
        if (itemsCarrito.length === 0) {
            return res.status(400).json({ msg: 'El carrito está vacío.' });
        }
        const direccion = await DireccionDespacho.findOne({ _id: direccion_id, usuario_id: req.usuario.id });
        if (!direccion) {
            return res.status(404).json({ msg: 'Dirección de despacho no válida.' });
        }

        
        let totalPedido = 0;
        let detallePedido = [];
        let stockActualizaciones = [];

        for (const item of itemsCarrito) {
            const producto = await Producto.findById(item.producto_id);
            
            if (!producto || producto.stock < item.cantidad) {
                return res.status(400).json({ 
                    msg: `Stock insuficiente para ${item.nombre_producto}. Solo quedan ${producto ? producto.stock : 0}.`
                });
            }

            
            totalPedido += item.precio_unitario * item.cantidad;
            detallePedido.push({
                producto_id: item.producto_id,
                nombre_producto: item.nombre_producto,
                cantidad: item.cantidad,
                precio_pagado: item.precio_unitario
            });

            
            stockActualizaciones.push({
                id: item.producto_id,
                nuevaCantidad: producto.stock - item.cantidad
            });
        }
        
        const nuevoPedido = new Pedido({
            usuario_id: req.usuario.id,
            direccion_despacho_id: direccion_id,
            total_pedido: totalPedido,
            estado: 'PENDIENTE_PAGO' 
        });
        await nuevoPedido.save();

        
        for (const detalle of detallePedido) {
            
            const detalleItem = new DetallePedido({ ...detalle, pedido_id: nuevoPedido._id });
            await detalleItem.save();
            
            
            await Producto.findByIdAndUpdate(detalle.producto_id, { 
                $inc: { stock: -detalle.cantidad } 
            });
        }

        
        await ItemCarrito.deleteMany({ usuario_id: req.usuario.id });

        res.json({
            msg: 'Pedido creado exitosamente. Pendiente de pago.',
            pedido_id: nuevoPedido._id,
            total: totalPedido
            
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el servidor durante el checkout');
    }
});


router.get('/', auth, async (req, res) => {
    try {
        const pedidos = await Pedido.find({ usuario_id: req.usuario.id }).sort({ fecha_pedido: -1 });
        res.json(pedidos);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error al obtener pedidos');
    }
});

module.exports = router;