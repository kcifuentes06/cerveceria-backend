const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); 
const Pedido = require('../models/Pedido');
const ItemCarrito = require('../models/ItemCarrito');
const DetallePedido = require('../models/DetallePedido');
const DireccionDespacho = require('../models/DireccionDespacho');
const Producto = require('../models/Producto');
const Usuario = require('../models/Usuario');
const authMiddleware = require('../middleware/auth'); 
const { sendDigitalReceipt } = require('../utils/emailSender'); 
const mercadopago = require('mercadopago');


let mpInstance = mercadopago;

// CRÍTICO: Si el SDK usa un export 'default' (común en versiones modernas),
// el objeto que contiene 'configure' estará en 'mercadopago.default'.
if (mpInstance && mpInstance.default) {
    mpInstance = mpInstance.default;
}

try {
    // Intenta la configuración usando el objeto resultante
    mpInstance.configure({
        access_token: process.env.MERCADOPAGO_ACCESS_TOKEN,
    });
} catch (e) {
    console.error("❌ ERROR CRÍTICO DE MERCADOPAGO CONFIGURATION:", e.message);
    console.error("Verifica que tu Access Token esté definido y que el paquete 'mercadopago' esté instalado.");
}

const checkAdmin = (req, res, next) => {
    if (req.usuario_id) { 
        return next(); 
    }
    return res.status(403).json({ message: 'Acceso prohibido. Se requiere rol de administrador/dueño.' });
};


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
        const mpItems = []; 
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
            
            mpItems.push({
                title: item.nombre_producto,
                unit_price: item.precio_unitario,
                quantity: item.cantidad,
                currency_id: "CLP" 
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

        
        const preference = {
            items: mpItems,
            external_reference: pedidoGuardado._id.toString(), 
            back_urls: {
                success: "http://localhost:3000/resumen_pago.html?status=success&id=" + pedidoGuardado._id, 
                pending: "http://localhost:3000/resumen_pago.html?status=pending&id=" + pedidoGuardado._id,
                failure: "http://localhost:3000/resumen_pago.html?status=failure&id=" + pedidoGuardado._id,
            },
            auto_return: "approved",
            notification_url: process.env.NODE_ENV === 'production' ? 
                            "https://tudominio.com/api/pedidos/webhook" : 
                            "https://[your_ngrok_url]/api/pedidos/webhook", 
        };

        const mpResponse = await mercadopago.preferences.create(preference);
        
        res.json({ 
            message: 'Pedido creado. Redirigiendo a Mercado Pago.', 
            init_point: mpResponse.body.init_point 
        });

    } catch (err) {
        if (session.inTransaction()) {
            await session.abortTransaction();
            session.endSession();
        }
        console.error('Error durante el checkout:', err);
        res.status(500).json({ message: 'Error al procesar el pedido o la pasarela de pago.', error: err.message });
    }
});

router.post('/webhook', async (req, res) => {
    const topic = req.query.topic || req.query.type;

    res.status(200).send('OK'); 

    if (topic === 'payment') {
        const paymentId = req.body.data.id;
        
        try {
            const payment = await mercadopago.payment.findById(paymentId);
            const paymentStatus = payment.body.status;
            const externalReference = payment.body.external_reference; 

            let nuevoEstado = 'PENDIENTE_PAGO';

            if (paymentStatus === 'approved') {
                nuevoEstado = 'PAGADO';
            } else if (paymentStatus === 'rejected') {
                nuevoEstado = 'CANCELADO';
                
            }
            
            
            const pedidoActualizado = await Pedido.findByIdAndUpdate(externalReference, 
                { estado: nuevoEstado }, 
                { new: true }
            );

            
            if (nuevoEstado === 'PAGADO' && pedidoActualizado) {
                const usuario = await Usuario.findById(pedidoActualizado.usuario_id);
                if (usuario) {
                    sendDigitalReceipt(usuario.email, pedidoActualizado); 
                }
            }

            console.log(`Webhook: Pedido ${externalReference} actualizado a estado: ${nuevoEstado}`);

        } catch (error) {
            console.error('Error al procesar el Webhook de MP:', error);
        }
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

router.put('/anular/:pedidoId', authMiddleware, async (req, res) => {
    const { pedidoId } = req.params;
    const { motivo } = req.body;
    const usuario_id = req.usuario_id;
    
    if (!motivo) {
        return res.status(400).json({ message: 'El motivo de anulación es obligatorio.' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const pedido = await Pedido.findOne({ _id: pedidoId, usuario_id }).session(session);

        if (!pedido) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Pedido no encontrado o no autorizado para anular.' });
        }
        
        if (pedido.estado !== 'PENDIENTE_PAGO' && pedido.estado !== 'PAGADO') {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: `No se puede anular un pedido en estado ${pedido.estado}.` });
        }

        const detalles = await DetallePedido.find({ pedido_id: pedidoId }).session(session);

        
        for (const detalle of detalles) {
            const producto = await Producto.findById(detalle.producto_id).session(session);
            
            if (producto) {
                producto.stock += detalle.cantidad; 
                await producto.save({ session });
            }
        }

        
        pedido.estado = 'CANCELADO';
        await pedido.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.json({ message: `Pedido ${pedidoId} ha sido CANCELADO y el stock ha sido restaurado.`, nuevo_estado: 'CANCELADO' });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Error al anular pedido:', error);
        res.status(500).json({ message: 'Error interno al procesar la anulación.', error: error.message });
    }
});

router.get('/reporte-ventas', authMiddleware, checkAdmin, async (req, res) => {
    const { start, end } = req.query;

    if (!start || !end) {
        return res.status(400).json({ message: 'Se requiere un rango de fechas (start y end).' });
    }

    try {
        const startDate = new Date(start);
        const endDate = new Date(end);

        const reporte = await Pedido.aggregate([
            {
                $match: {
                    fecha_pedido: { $gte: startDate, $lte: endDate },
                    estado: 'PAGADO' 
                }
            },
            {
                $group: {
                    _id: null,
                    totalVentas: { $sum: '$total_pedido' },
                    conteoPedidos: { $sum: 1 },
                }
            }
        ]);

        if (reporte.length === 0) {
            return res.status(200).json({ totalVentas: 0, conteoPedidos: 0, message: 'No se encontraron ventas pagadas en el período.' });
        }

        res.status(200).json(reporte[0]);

    } catch (error) {
        res.status(500).json({ message: 'Error interno al procesar el reporte.' });
    }
});

module.exports = router;