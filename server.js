
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');


dotenv.config();


const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cerveceriaDB';


mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB conectado exitosamente.'))
    .catch(err => {
        console.error('Error de conexión a MongoDB:', err.message);
        process.exit(1); 
    });

app.use(express.json());

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.use(express.static(path.join(__dirname, 'public')));


const authMiddleware = require('./middleware/auth'); 
const authRoutes = require('./routes/authRoutes');
const productosRoutes = require('./routes/productosRoutes');
const carritoRoutes = require('./routes/carritoRoutes');
const direccionesRoutes = require('./routes/direccionesRoutes');
const pedidosRoutes = require('./routes/pedidosRoutes'); 

app.use('/api/auth', authRoutes);


app.use('/api/productos', productosRoutes);

app.use('/api/carrito', authMiddleware, carritoRoutes);
app.use('/api/direcciones', authMiddleware, direccionesRoutes);
app.use('/api/pedidos', authMiddleware, pedidosRoutes); 

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'catalog.html'));
});

app.use((err, req, res, next) => {
    console.error(err.stack); 
    const statusCode = err.status || 500;
    
    const message = statusCode === 500 && process.env.NODE_ENV === 'production' 
                    ? 'Error interno del servidor.' 
                    : err.message || 'Error desconocido';

    res.status(statusCode).json({
        message: message,
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});


app.listen(PORT, () => {
    console.log(`🚀 Servidor Express funcionando en http://localhost:${PORT}`);
    console.log(`Modo de entorno: ${process.env.NODE_ENV || 'development'}`);
});