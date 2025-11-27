const express = require('express');
const router = express.Router();
const Producto = require('../models/Producto'); 
const authMiddleware = require('../middleware/auth'); 


const checkAdmin = (req, res, next) => {

    if (req.usuario_id) { 
        console.log(`[Admin Access] Usuario ID: ${req.usuario_id}`);
        return next(); 
    }
    return res.status(403).json({ message: 'Acceso prohibido. Se requiere autenticación y permisos de administrador.' });
};

router.get('/', async (req, res) => {
    try {
        const { tipo, variedad, search } = req.query; 
        
        
        const filtros = {};

        
        filtros.stock = { $gt: 0 }; 

        
        if (tipo && tipo !== 'todos') {
            filtros.tipo = tipo;
        }
        
        
        if (variedad && variedad !== 'todas') {
            filtros.variedad = { 
                $regex: variedad, 
                $options: 'i' 
            };
        }
        
        
        if (search) {
            const regexQuery = { $regex: search, $options: 'i' }; 
            
            
            filtros.$or = [
                { nombre: regexQuery },
                { descripcion: regexQuery }
            ];
            

        }

        const productos = await Producto.find(filtros); 
        res.json(productos);

    } catch (err) {
        console.error("Error al obtener productos con filtros:", err);
        res.status(500).json({ message: 'Error interno al obtener productos.', error: err.message });
    }
});

router.get('/admin', authMiddleware, checkAdmin, async (req, res) => {
    try {
        // Lógica para obtener todos los productos sin filtros
        const productos = await Producto.find({}); // Usar find({}) para asegurar que no haya filtros residuales
        res.json(productos);
    } catch (error) {
        console.error('Error al obtener productos para admin:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

router.post('/admin', authMiddleware, checkAdmin, async (req, res) => {
    try {
        const nuevoProducto = new Producto(req.body);
        const productoGuardado = await nuevoProducto.save();
        res.status(201).json({ message: 'Producto creado con éxito.', producto: productoGuardado });
    } catch (err) {
        res.status(400).json({ message: 'Error al crear producto.', error: err.message });
    }
});

router.get('/admin/:id', authMiddleware, checkAdmin, async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id);
        if (!producto) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }
        res.json(producto);
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener producto.', error: err.message });
    }
});

router.put('/admin/:id', authMiddleware, checkAdmin, async (req, res) => {
    try {
        const productoActualizado = await Producto.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true }
        );
        if (!productoActualizado) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }
        res.json({ message: 'Producto actualizado con éxito.', producto: productoActualizado });
    } catch (err) {
        res.status(400).json({ message: 'Error al actualizar producto.', error: err.message });
    }
});

router.delete('/admin/:id', authMiddleware, checkAdmin, async (req, res) => {
    try {
        const resultado = await Producto.findByIdAndDelete(req.params.id);
        if (!resultado) {
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }
        res.json({ message: 'Producto eliminado con éxito.' });
    } catch (err) {
        res.status(500).json({ message: 'Error al eliminar producto.', error: err.message });
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
        res.json({ message: 'Productos de prueba insertados con éxito.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al insertar productos.', error: error.message });
    }
});

module.exports = router;