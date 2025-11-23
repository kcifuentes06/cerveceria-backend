const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UsuarioSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    rut: {
        type: String,
        require: true,
        unique: true,
        trim: true
    },
    fecha_registro: {
        type: Date,
        default: Date.now
    }
});

UsuarioSchema.pre('save', async function(next) {
    if (this.isModified('password')){
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
})

module.exports = mongoose.model('Usuario', UsuarioSchema);