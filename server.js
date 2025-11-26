const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors'); 


dotenv.config();


const app = express(); 
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI; 

mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB conectado exitosamente.'))
    .catch(err => {
        console.error('Error de conexión a MongoDB:', err.message);
        
        process.exit(1); 
    });

app.use(cors()); 
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
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

app.use('/api/pedidos', pedidosRoutes); 

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
        message: message
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor Express funcionando en http://localhost:${PORT}`);
});