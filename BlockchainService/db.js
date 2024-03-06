require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });
const mongoose = require('mongoose');

// Habilita la depuración de Mongoose para ver las operaciones en la consola
mongoose.set('debug', true);

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI;
        // Opciones ajustadas para la versión actual de Mongoose y MongoDB
        const options = {
            serverSelectionTimeoutMS: 5000, // Tiempo de espera para la selección del servidor
        };

        await mongoose.connect(mongoURI, options);
        console.log('MongoDB Connected Successfully');
    } catch (err) {
        console.error('MongoDB Connection Error:', err);
        // No utilizar process.exit(1) en un entorno de prueba
        if (process.env.NODE_ENV !== 'test') {
            process.exit(1);
        }
    }
};

module.exports = connectDB;

