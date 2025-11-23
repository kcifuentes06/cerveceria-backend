const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario'); 

const JWT_SECRET = process.env.JWT_SECRET; 

const generarToken = (usuario) => {
    return jwt.sign(
        { id: usuario._id, email: usuario.email },
        JWT_SECRET,
        { expiresIn: '1d' }
    );
};

router.post('/register', async (req, res) => {
    const { nombre, email, password, rut } = req.body;

    try {
        let usuarioExistente = await Usuario.findOne({ $or: [{ email }, { rut }] });
        if (usuarioExistente) {
            return res.status(400).json({ message: 'El correo o RUT ya están registrados.' });
        }

        const nuevoUsuario = new Usuario({ nombre, email, password, rut });
        await nuevoUsuario.save();

        const token = generarToken(nuevoUsuario);

        res.status(201).json({ 
            token, 
            message: 'Registro exitoso. Bienvenido/a.'
        });
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor durante el registro.' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        const esValido = await usuario.compararPassword(password);
        if (!esValido) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        const token = generarToken(usuario);

        res.json({ 
            token, 
            message: 'Inicio de sesión exitoso.',
            usuario: { id: usuario._id, nombre: usuario.nombre } 
        });

    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor durante el inicio de sesión.' });
    }
});

module.exports = router;