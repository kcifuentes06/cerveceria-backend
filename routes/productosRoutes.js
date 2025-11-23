const express = require('express');
const router = express.Router();
const Producto = require('../models/Producto'); 


router.get('/', async (req, res) => {
    try {

        const filtros = {};
        if (req.query.tipo && req.query.tipo !== 'todos') filtros.tipo = req.query.tipo;
        if (req.query.variedad && req.query.variedad !== 'todas') filtros.variedad = req.query.variedad;
        
        const productos = await Producto.find(filtros); 
        res.json(productos);
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener productos.', error: err.message });
    }
});


router.post('/seed', async (req, res) => {
    try {
        await Producto.deleteMany({});

        const productosIniciales = [
            { nombre: 'Cerveza Lager', descripcion: 'Ligera y refrescante.', precio: 5500, stock: 50, tipo: 'cerveza', variedad: 'lager', imagen_url: 'img/lager.webp' },
            { nombre: 'Cerveza IPA', descripcion: 'Amargor marcado y aromas a lúpulo.', precio: 6200, stock: 35, tipo: 'cerveza', variedad: 'ipa', imagen_url: 'img/ipa.webp' },
            { nombre: 'Cerveza Stout', descripcion: 'Notas de café y chocolate.', precio: 6000, stock: 40, tipo: 'cerveza', variedad: 'stout', imagen_url: 'img/stout.webp' },
            { nombre: 'Cerveza Ale', descripcion: 'Sabor afrutado, espuma cremosa.', precio: 5800, stock: 45, tipo: 'cerveza', variedad: 'ale', imagen_url: 'img/ale.webp' },
            { nombre: 'Growler 1L', descripcion: 'Botella reutilizable para recarga.', precio: 8000, stock: 20, tipo: 'growler', variedad: 'n/a', imagen_url: 'img/growler1.webp' },
            { nombre: 'Growler 2L', descripcion: 'Ideal para compartir.', precio: 12000, stock: 15, tipo: 'growler', variedad: 'n/a', imagen_url: 'img/growler2.webp' },
        ];
        
        await Producto.insertMany(productosIniciales);
        res.json({ message: 'Productos insertados con éxito. Usa esta ruta solo una vez.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al insertar productos.', error: error.message });
    }
});

module.exports = router;