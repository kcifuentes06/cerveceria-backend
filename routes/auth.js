const express = require('express');
const router = express.Router();
const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/registro', async (req, res) => {
    const {email, password, nombre, rut} = req.body;
    try {
        let usuario = await Usuario.findOne({email});
        if (usuario) {
            return res.status(400).json({msg: 'El usuario ya existe'});
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        usuario = new Usuario({email, password_hash, nombre, rut});
        await usuario.save();

        const payload = {usuario: {id: usuario.id}};
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            {expiresIn: '2m'},
            (err, token) => {
                if (err) throw err;
                res.json({token, msg: 'Usuario registrado con exito'});
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el servidor');
    }
});

router.post('/login', async (req,res) =>{
    const {email, password} = req.body;
    try{
        let usuario = await Usuario.findOne({email});
        if(!usuario){
            return res.status(400).json({msg: 'Credenciales invalidas'});
        }

        const isMatch = await bcrypt.compare(password, usuario.password_hash);
        if (!isMatch) {
            return res.status(400).json({msg: 'Credenciales invalidas'});
        }

        const payload = {usuario: {id: usuario.id}};
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            {expiresIn: '2m'},
            (err, token) => {
                if (err) throw err;
                res.json({token});
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el sevidor');
    }
});

module.exports = router;