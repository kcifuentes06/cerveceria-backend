const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UsuarioSchema = new mongoose.Schema({
    nombre: { 
        type: String, 
        required: true 
    },

    email: { 
        type: String, 
        required: true, 
        unique: true 
    },

    password: { 
        type: String, 
        required: true 
    },

    rut: { 
        type: String, 
        required: true, 
        unique: true 
    },

    rol: {
        type: String,
        enum: ['cliente', 'administrador', 'cajerovirtual', 'encargadodespacho'],
        default: 'cliente' 
    }
});

UsuarioSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

UsuarioSchema.methods.compararPassword = function(canditatePassword) {
    return bcrypt.compare(canditatePassword, this.password);
};

module.exports = mongoose.model('Usuario', UsuarioSchema);