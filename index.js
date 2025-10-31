const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

connectDB();

app.use(express.json());

app.use('/api/v1/auth',require('./routes/auth'));
app.use('/api/v1/productos',require('./routes/productos'));
app.use('/api/v1/carrito', require('./routes/carrito'));
app.use('/api/v1/pedidos', require('./routes/pedidos'));

const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=> console.log('Servidor corriendo en el puerto ${PORT}'));
