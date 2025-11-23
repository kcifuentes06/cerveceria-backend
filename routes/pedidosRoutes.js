const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); 
const Pedido = require('../models/Pedido');
const ItemCarrito = require('../models/ItemCarrito');
const DetallePedido = require('../models/DetallePedido');
const DireccionDespacho = require('../models/DireccionDespacho');
const Producto = require('../models/Producto');
const authMiddleware = require('../middleware/auth'); 

router.post('/checkout', authMiddleware, async (req, res) => {
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
        console.error('Error durante el checkout:', err);
        res.status(500).json({ message: 'Error al procesar el pedido. Intente nuevamente.', error: err.message });
    }
});

router.get('/usuario/historial', authMiddleware, async (req, res) => {
    try {
        const userId = req.usuario_id;

        
        const pedidos = await Pedido.find({ usuario_id: userId })
            .sort({ fecha_pedido: -1 })
            .select('-__v')
            .lean(); 

        if (pedidos.length === 0) {
            return res.status(200).json([]);
        }

        const historialCompleto = await Promise.all(pedidos.map(async (pedido) => {
            
            const detalles = await DetallePedido.find({ pedido_id: pedido._id })
                .select('nombre_producto cantidad precio_pagado')
                .lean();

            const direccion = await DireccionDespacho.findById(pedido.direccion_despacho_id)
                .select('calle numero comuna region')
                .lean();

            const fechaFormateada = new Date(pedido.fecha_pedido).toLocaleDateString('es-CL', { 
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
            });

            return {
                ...pedido,
                detalles: detalles,
                direccion: direccion,
                fecha_formateada: fechaFormateada
            };
        }));

        res.status(200).json(historialCompleto);

    } catch (error) {
        console.error('Error al obtener el historial de pedidos:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener historial.' });
    }
});

module.exports = router;