const mongoose = require('mongoose');

const PedidoSchema = new mongoose.Schema({
    usuario_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    fecha_pedido: {
        type: Date,
        default: Date.now
    },
    direccion_despacho_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DireccionDespacho',
        required: true
    },
    total_pedido: {
        type: Number,
        required: true
    },
    estado: { 
        type: String,
        enum: ['PENDIENTE_PAGO', 'PAGADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO'],
        default: 'PENDIENTE_PAGO'
    },
    codigo_seguimiento: {
        type: String
    }
});

module.exports = mongoose.model('Pedido', PedidoSchema);