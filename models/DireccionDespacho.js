const mongoose = require('mongoose');

const DireccionDespachoSchema = new mongoose.Schema({
    usuario_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    etiqueta: { 
        type: String,
        required: true
    },
    rut_receptor: {
        type: String,
        required: true
    },
    correo_receptor: {
        type: String,
        required: true
    },
    calle: {
        type: String,
        required: true
    },
    numero: {
        type: String, 
        required: true
    },
    comuna: {
        type: String,
        required: true
    },
    region: {
        type: String,
        required: true
    },
    es_principal: { 
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('DireccionDespacho', DireccionDespachoSchema);