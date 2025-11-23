const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

const authRoutes = require('./routes/authRoutes');
const productosRoutes = require('./routes/productosRoutes');
const carritoRoutes = require('./routes/carritoRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');
const authMiddleware = require('./middleware/auth');

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname,'public')));

mongoose.connect(MONGODB_URI)
    .then(() => console.log('Conectado a MongoDB'))
    .catch(err => console.error('Error de conexión a MongoDB: ', err));

app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);

app.use('/api/carrito', authMiddleware, carritoRoutes);
app.use('/api/checkout', authMiddleware,checkoutRoutes);

app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')){
        res.sendFile(path.join(__dirname, 'public', 'catalog.html'));
    }
});

app.listen(PORT, () => {
    console.log('Servidor Express escuchandop em http://localhost:${PORT}');
    console.log('Frontend disponible en http:://localhost:${PORT}/catalog.html');
});