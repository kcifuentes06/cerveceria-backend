const express = require('express');
const router = express.Router();
const Producto = require('../models/Producto');

router.get('/', async (req, res) => {
    try {
        const {tipo, variedad, search} = req.query;
        let query = {};

        if (tipo && tipo !== 'todos'){
            query.tipo = tipo;
        }

        if(tipo === 'cerveza' && variedad && variedad !== 'todas') {
            query.variedad = variedad;
        }

        if (search){
            query.$or = [
                {nombre: {$regex: search, $option: 'i'}},
                {descripcion: {$regex: search, $options: 'i'}}
            ];
        }

        const productos = await Producto.find(query);
        res.json(productos);
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el servidor');
    }
});

router.post('/', async (req, res) => {
    try {
        const nuevoProducto = new Producto(req.body);
        await nuevoProducto.save();
        res.status(201).json(nuevoProducto);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error al crear producto');
    }
});

module. exports = router;