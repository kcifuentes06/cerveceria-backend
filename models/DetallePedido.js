const mongoose = require('mongoose');

const DetallePedidoSchema = new mongoose.Schema({
    pedido_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pedido',
        required: true
    },
    producto_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Producto',
        required: true
    },
    nombre_producto: {
        type: String,
        required: true
    },
    cantidad: {
        type: Number,
        required: true
    },
    precio_pagado: { 
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('DetallePedido', DetallePedidoSchema);
