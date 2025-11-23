const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); 
const DireccionDespacho = require('../models/DireccionDespacho');
const Pedido = require('../models/Pedido');
const ItemCarrito = require('../models/ItemCarrito');
const DetallePedido = require('../models/DetallePedido');
const Producto = require('../models/Producto'); 

router.get('/direcciones', async (req, res) => {
    try {
        const direcciones = await DireccionDespacho.find({ usuario_id: req.usuario_id });
        res.json(direcciones);
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener direcciones.', error: err.message });
    }
});

router.post('/direcciones', async (req, res) => {
    const { _id, etiqueta, rut_receptor, correo_receptor, calle, numero, comuna, region } = req.body;
    const usuario_id = req.usuario_id;

    try {
        if (_id) {
            const direccionActualizada = await DireccionDespacho.findOneAndUpdate(
                { _id, usuario_id }, 
                { etiqueta, rut_receptor, correo_receptor, calle, numero, comuna, region }, 
                { new: true }
            );
            if (!direccionActualizada) return res.status(404).json({ message: 'Dirección no encontrada.' });
            res.json({ message: 'Dirección actualizada con éxito.', direccion: direccionActualizada });
        } else {
            const nuevaDireccion = new DireccionDespacho({
                usuario_id,
                etiqueta: etiqueta || `${calle} #${numero}`,
                rut_receptor, correo_receptor, calle, numero, comuna, region
            });
            await nuevaDireccion.save();
            res.status(201).json({ message: 'Nueva dirección guardada con éxito.', direccion: nuevaDireccion });
        }
    } catch (err) {
        res.status(400).json({ message: 'Error al guardar la dirección.', error: err.message });
    }
});

router.post('/checkout', async (req, res) => {
    const { direccion_despacho_id } = req.body;
    const usuario_id = req.usuario_id;

    if (!direccion_despacho_id) {
        return res.status(400).json({ message: 'Debe seleccionar una dirección de despacho.' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const itemsCarrito = await ItemCarrito.find({ usuario_id }).session(session);

        if (itemsCarrito.length === 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'El carrito está vacío.' });
        }

        let totalPedido = 0;
        const detalles = [];
        
        for (const item of itemsCarrito) {
            const producto = await Producto.findById(item.producto_id).session(session);

            if (!producto || producto.stock < item.cantidad) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ message: `Stock insuficiente para ${item.nombre_producto}.` });
            }
            
            totalPedido += item.cantidad * item.precio_unitario;

            producto.stock -= item.cantidad;
            await producto.save({ session });

            detalles.push({
                producto_id: item.producto_id,
                nombre_producto: item.nombre_producto,
                cantidad: item.cantidad,
                precio_pagado: item.precio_unitario
            });
        }

        const nuevoPedido = new Pedido({
            usuario_id,
            direccion_despacho_id,
            total_pedido: totalPedido,
            estado: 'PENDIENTE_PAGO'
        });
        const pedidoGuardado = await nuevoPedido.save({ session });

        const detallesConPedidoId = detalles.map(d => ({ ...d, pedido_id: pedidoGuardado._id }));
        await DetallePedido.insertMany(detallesConPedidoId, { session });

        await ItemCarrito.deleteMany({ usuario_id }).session(session);

        await session.commitTransaction();
        session.endSession();
        
        res.json({ 
            message: 'Pedido creado. Redirigiendo a pasarela de pago.', 
            pedido_id: pedidoGuardado._id,
            total: totalPedido
        });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ message: 'Error al procesar el pedido. Intente nuevamente.', error: err.message });
    }
});

module.exports = router;