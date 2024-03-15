require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const CryptoJS = require("crypto-js");
const cloudinary = require('cloudinary').v2;
const fs = require('fs').promises;
const path = require('path');

// Configura Cloudinary con tus credenciales
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const upload = multer({ 
    dest: 'uploads/', 
    limits: { fileSize: 200000 * 1024 } // Ejemplo para un límite de 200,000 KB (195 MB)
});

const corsOptions = {
    origin: 'https://tangleapp.luxen.club',
    optionsSuccessStatus: 200,
};

// Habilitar CORS para todas las rutas
app.use(cors(corsOptions));

app.get('/', (req, res) => {
    console.log("Solicitud recibida en /");
    res.send('StorageServer is running');
});

app.post('/uploadToAzure', upload.single('file'), async (req, res) => {
    console.log("Entró al endpoint /upload")
    console.log("Este es el req.file: ", req.file);
    if (!req.file) {
        return res.status(400).send('No file uploaded');
    }

    try {
        const file = req.file;
        const fileData = await fs.readFile(file.path);

        // Calcula el hash SHA-3 del archivo
        const hashSHA3 = CryptoJS.SHA3(CryptoJS.lib.WordArray.create(fileData), { outputLength: 512 }).toString();

        // Extrae el nombre del archivo y la extensión
        const originalNameWithoutExtension = path.parse(file.originalname).name;
        const extension = path.parse(file.originalname).ext;
        const cloudinaryFileName = `${originalNameWithoutExtension}-${Date.now()}${extension}`;

        // Carga el archivo a Cloudinary con el nombre original
        const result = await cloudinary.uploader.upload(file.path, {
            resource_type: "auto", // auto detectará el tipo de archivo automáticamente
            public_id: cloudinaryFileName // Establece el nombre del archivo en Cloudinary
        });
        
        console.log("URL del archivo en Cloudinary:", result.url);
        console.log("Hash SHA-3 del archivo:", hashSHA3);

        // Elimina el archivo temporal de forma asíncrona
        await fs.unlink(file.path);

        res.json({ azureBlobUrl : result.url, hashSHA3 });
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        res.status(500).send('Server error');
    }
});

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
    console.log(`StorageService running on port ${PORT}`);
});
