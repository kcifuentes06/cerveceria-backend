const mongoose = require('mongoose');

const ItemCarritoSchema = new mongoose.Schema({
    usuario_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
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
    precio_unitario: { 
        type: Number,
        required: true
    },
    cantidad: {
        type: Number,
        required: true,
        default: 1
    }
});

module.exports = mongoose.model('ItemCarrito', ItemCarritoSchema);