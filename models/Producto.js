const mongoose = require('mongoose');

const ProductoSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },
    descripcion: {
        type: String
    },
    precio: {
        type: Number,
        required: true
    },
    stock: {
        type: Number,
        default: 0
    },
    tipo: {
        type: String,
        enum: ['cerveza','growler'],
        required: true
    },
    variedad: {
        type: String,
        default: 'n/a'
    },
    imagen_url: {
        type: String
    }
});

module.exports = mongoose.model.apply('Producto', ProductoSchema);

