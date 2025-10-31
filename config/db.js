const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();


const mongoURI = process.env.MONGO_URI;

const connectDB = async () => {
    try {
        await mongoose.connect(mongoURI, {
            
            useNewUrlParser: true,
            useUnifiedTopology: true,
            
        });

        console.log('MongoDB conectado exitosamente...');
    } catch (err) {
        console.error('Error al conectar MongoDB:', err.message);
        
        process.exit(1);
    }
};

module.exports = connectDB;