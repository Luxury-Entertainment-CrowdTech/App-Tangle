// AuthService/index.js
require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });
const express = require('express');
const { sha3_512 } = require('js-sha3');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { generateSecureToken, encryptToken, sendTokenByEmail, encryptText, decryptText, generateAccessToken } = require('./authUtils');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

// Crea el directorio de uploads si no existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir)
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
});

// Configuración de Multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 * 1024, // 8 GB
    }
});

// Middleware para manejar errores de Multer, incluyendo el límite de tamaño de archivo
function multerErrorHandler(err, req, res, next) {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).send('El archivo supera el límite de tamaño permitido de 5 GB.');
        }
        // Otros errores de Multer
        return res.status(500).send(err.message);
    } else if (err) {
        // Errores no relacionados con Multer
        return res.status(500).send('Error al procesar la solicitud.');
    }
    next();
}

const userServiceURL = process.env.USER_SERVICE_URL;
const app = express();
// app.use(cors(corsOptions)); // Habilitar CORS
app.use(cors()); 
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(multerErrorHandler);

app.get('/', (req, res) => {
    console.log("Solicitud recibida en /");
    res.send('AuthService is running');
});

app.post('/register', upload.single('faceImage'), async (req, res) => {
    console.log("Solicitud recibida en /register");
    // Aquí trasladas la lógica para registrar un usuario desde server.js
    const { nombre, apellido, email, usuario, contrasena, telefono, hash3 } = req.body;

    console.log(req.file.path + "Este es el archivo");
    console.log(hash3 + "Este es el hash3");
    
    if (!req.file || !telefono || !usuario || !contrasena) {
        return res.status(400).send('Los campos obligatorios no están completos o falta la imagen de rostro.');
    }

    console.log("Preparando para enviar datos al servicio de reconocimiento facial");
    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path));
    console.log(formData.getHeaders());

    axios.post(`${process.env.FACIAL_RECOGNITION_SERVICE_URL}/register`, formData, { headers: { ...formData.getHeaders() } })
    .then(async (responseFace) => {
        console.log(`Respuesta del servicio de reconocimiento facial: ${JSON.stringify(responseFace.data)}`);

        if (responseFace.status === 201) {
            console.log(`Entro para registrar Usuario`);
            const [encryptedNombre, encryptedApellido, encryptedEmail, encryptedUsuario, encryptedContrasena, encryptedTelefono] = await Promise.all([
                encryptText(String(nombre)),
                encryptText(String(apellido)),
                encryptText(String(email)),
                encryptText(String(usuario)),
                encryptText(String(contrasena)),
                encryptText(String(telefono)),
            ]);

            const response = await axios.post(`${userServiceURL}/createUser`, {
                faceId: responseFace.data.user_id,
                hash3,
                nombre: encryptedNombre,
                apellido: encryptedApellido,
                email: encryptedEmail,
                usuario: encryptedUsuario,
                contrasena: encryptedContrasena,
                numeroTelefono: encryptedTelefono,
                activo: true
            });

            if (response.status === 201) {
                res.status(201).send('Usuario registrado con éxito');
            } else {
                res.status(response.status).send('Error al registrar usuario');
            }
        } else {
            res.status(500).send('Error al registrar el rostro');
        }
    })
    .catch((error) => {
        console.error("Error al enviar datos de reconocimiento facial:", error.toString());
        if (error.response) {
            console.error("Data:", error.response.data);
            console.error("Status:", error.response.status);
            console.error("Headers:", error.response.headers);
        } else if (error.request) {
            console.error("No response received:", error.request);
        } else {
            console.error("Error:", error.message);
        }
        res.status(500).send('Error en el servidor.');
    });
});

app.post('/login', async (req, res) => {
    console.log("Solicitud recibida en /login")
    const { usuario, contrasena } = req.body;
    console.log(usuario, contrasena);
    const hash3 = sha3_512(usuario + contrasena);
    console.log(hash3 + " :Este es el hash3");

    try {
        // Realiza una solicitud al UserService para obtener el usuario por hash3
        const userResponse = await axios.get(`${userServiceURL}/getUserByHash3/${hash3}`);
        const user = userResponse.data;
        console.log(user._id + " :Este es el id del usuario");
        console.log(user.faceId + " :Este es el faceId del usuario");

        const usuarioDescifrado = await decryptText(user.usuario);

        if (userResponse.status === 200 && user) {
            // Usuario encontrado, proceder con la verificación facial
            res.json({
                message: 'Credenciales válidas. Proceda con la verificación facial.',
                userId: user._id,
                faceId: user.faceId,
                usuarioDescifrado: usuarioDescifrado
            });
        } else {
            // Usuario no encontrado
            res.status(401).json({ message: 'Credenciales inválidas' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

app.post('/verify-face', upload.single('faceImage'), async (req, res) => {
    const faceId = req.body.faceId; // Obtiene el faceId del cuerpo de la solicitud
    
    const userId = req.body.userId;
    const usuarioDescifrado = req.body.usuarioDescifrado;
    console.log(faceId + " :Este es el faceId");
    console.log(userId + " :Este es el userId");
    console.log(usuarioDescifrado + " :Este es el usuarioDescifrado");
    // console.log(user + " :Este es el user");
    if (!req.file || !faceId) {
        console.log("No se encontró la imagen de rostro o el faceId");
        return res.status(400).send('Imagen de rostro y faceId son requeridos');
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path));
    formData.append('faceId', faceId);

    try {
        const responseFace = await axios.post(`${process.env.FACIAL_RECOGNITION_SERVICE_URL}/verify`, formData, {
            headers: {
                ...formData.getHeaders(),
            },
        });

        if (responseFace.data.message === 'User verified') {
            const accessToken = generateAccessToken(usuarioDescifrado, userId);
            res.cookie('token', accessToken, { httpOnly: true });
            return res.status(200).json({
                message: 'Verificación facial exitosa',
                token: accessToken,
                userId: userId,
            });
        } else if (responseFace.data.message === 'Face not recognized') {
            return res.status(401).json({ message: 'Rostro no reconocido. Verificación facial fallida.' });
        } else if (responseFace.data.message === 'No faces found in the image') {
            return res.status(400).json({ message: 'No se encontraron rostros en la imagen.' });
        } else if (responseFace.data.message === 'User not found') {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
    } catch (err) {
        console.error(err);
        if (err.response && err.response.status === 400) {
            return res.status(400).json({ message: 'No se encontraron rostros en la imagen.' });
        }
        // Otros errores no manejados por el microservicio de Python serán tratados como errores del servidor
        return res.status(500).json({ message: 'Error en el servidor.' });
    }
});

app.get('/logout', (req, res) => {
    // Lógica para cerrar sesión
    res.clearCookie('token');
    res.status(200).send('Sesión cerrada con éxito');
});

module.exports = app;

// Solo inicia el servidor si no estás en un entorno de prueba
if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT || 3004;
    app.listen(PORT, () => {
        console.log(`AuthService running on port ${PORT}`);
    });
}
