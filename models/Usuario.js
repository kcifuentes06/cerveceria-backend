const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password_hash: {
        type: String,
        required: true
    },
    nombre: {
        type: String
    },
    rut: {
        type: String,
        unique: true
    },
    fecha_creacion: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Usuario', UsuarioSchema);