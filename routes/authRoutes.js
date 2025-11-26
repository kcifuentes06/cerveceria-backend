const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario'); 

const dotenv = require('dotenv');
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET; 

async function validateEmailExternally(email) {
    const apiKey = process.env.EMAIL_VALIDATION_API_KEY;
    const apiUrl = process.env.EMAIL_VALIDATION_API_URL;

    
    if (!apiKey || !apiUrl) {
        console.warn('⚠️ API Key de Validación de Email no configurada. Saltando validación externa.');
        return true; 
    }

    try {
        
        const response = await fetch(`${apiUrl}?api_key=${apiKey}&email=${email}`);
        const data = await response.json();

        
        if (data.status === 'valid' || data.deliverability === 'DELIVERABLE') { 
            return true;
        } else {
            console.log(`Email Validation Failed for ${email}:`, data);
            return false;
        }
    } catch (error) {
        console.error('Error al llamar a la API de Validación de Email:', error);
        return true; 
    }
}


const generarToken = (usuario) => {
    
    return jwt.sign(
        { id: usuario._id, email: usuario.email, rol: usuario.rol }, 
        JWT_SECRET,
        { expiresIn: '1d' }
    );
};


router.post('/register', async (req, res) => {
    const { nombre, email, password, rut } = req.body;

    try {
        
        const isEmailValid = await validateEmailExternally(email);
        if (!isEmailValid) {
            return res.status(400).json({ message: 'El correo electrónico no es válido o activo. Por favor, verifica tu dirección.' });
        }
        
        
        let usuarioExistente = await Usuario.findOne({ $or: [{ email }, { rut }] });
        if (usuarioExistente) {
            return res.status(400).json({ message: 'El correo o RUT ya están registrados.' });
        }

        
        const nuevoUsuario = new Usuario({ nombre, email, password, rut });
        await nuevoUsuario.save();

        const token = generarToken(nuevoUsuario);

        res.status(201).json({ 
            token, 
            message: 'Registro exitoso. Bienvenido/a.',
            usuario: { 
                id: nuevoUsuario._id, 
                nombre: nuevoUsuario.nombre,
                rol: nuevoUsuario.rol 
            } 
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
            usuario: { 
                id: usuario._id, 
                nombre: usuario.nombre,
                rol: usuario.rol 
            } 
        });

    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor durante el inicio de sesión.' });
    }
});


module.exports = router;