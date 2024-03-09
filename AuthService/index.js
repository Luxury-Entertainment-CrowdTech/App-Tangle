// AuthService/index.js
require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });
const express = require('express');
const { sha3_512 } = require('js-sha3');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { generateRandomToken, encryptToken, sendTokenByEmail, encryptText, decryptText, generateAccessToken } = require('./authUtils');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

// Crea el directorio de uploads si no existe
const uploadsDir = path.join(__dirname, 'uploads');
fs.existsSync(uploadsDir) || fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir)
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
});

// const upload = multer({ dest: 'uploads/' }); // Configura multer para guardar archivos subidos
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 8 * 1024 * 1024 * 1024, // 8 GB
    }
});

// Lista de orígenes permitidos
const whitelist = [
    process.env.CLIENT_REACT_URL,
    process.env.APP_TANGLE_LOCAL,
    process.env.APP_TANGLE_DOMAIN,
    process.env.AUTH_SERVICE_URL,
    process.env.USER_SERVICE_URL,
    process.env.FACIAL_RECOGNITION_SERVICE_URL,
    process.env.ENCRYPTION_SERVICE_URL,
];

// Opciones de CORS
const corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            // Origin está en la lista blanca o no se ha especificado (solicitudes sin servidor, p.ej. Postman)
            console.log('Acceso permitido desde el siguiente origen:', origin);
            callback(null, true);
        } else {
            console.log('Intento de acceso no autorizado desde el siguiente origen:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Permitir envío de cookies y headers de autenticación
};

const userServiceURL = process.env.USER_SERVICE_URL;
const app = express();
app.use(cors(corsOptions)); // Habilitar CORS
app.use(cookieParser());
app.use(express.json({ limit: '8gb' }));
app.use(express.urlencoded({ limit: '8gb', extended: true }));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); // o en lugar de "*", especifica los dominios permitidos
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

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
    // Asume que 'faceImage' es el campo en el que se carga la imagen del rostro
    if (!req.file) {
        return res.status(400).send('Imagen de rostro requerida');
    }

    // Preparar la imagen para enviar al servicio de reconocimiento facial
    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path));

    if (!telefono || !usuario || !contrasena) {
        return res.status(400).send('Los campos obligatorios no están completos.');
    }

    // Espera a que cada campo sea cifrado antes de continuar
    const encryptedNombre = await encryptText(String(nombre));
    const encryptedApellido = await encryptText(String(apellido));
    const encryptedEmail = await encryptText(String(email));
    const encryptedUsuario = await encryptText(String(usuario));
    const encryptedContrasena = await encryptText(String(contrasena));
    const encryptedTelefono = await encryptText(String(telefono));

    // Envía el token por correo electrónico
    // sendTokenByEmail(email, rawToken);
    console.log(formData.getHeaders());
    try {

        // Llamada al servicio de reconocimiento facial para registrar el rostro
        const responseFace = await axios.post(`${process.env.FACIAL_RECOGNITION_SERVICE_URL}/register`, formData, {
            headers: {
                ...formData.getHeaders(),
            },
        });

        if (responseFace.status === 201) {
            const user_id = responseFace.data.user_id;
            console.log(`Usuario registrado con éxito en el servicio de reconocimiento facial: ${user_id}`);

            // Ahora, cuando llamas a UserService para crear un usuario, incluyes este faceId
            const response = await axios.post(`${userServiceURL}/createUser`, {
                faceId: user_id,
                hash3: hash3,
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
            // Manejo de la respuesta de reconocimiento facial
            return res.status(500).send('Error al registrar el rostro');
        }

    } catch (err) {
        console.error(err);
        res.status(500).send('Error en el servidor');
    }
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
    // const user = req.body.user;
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

app.post('/login', async (req, res) => {
    console.log("Solicitud recibida en /login")
    // Aquí trasladas la lógica para iniciar sesión desde server.js
    // const { usuario, contrasena, token } = req.body;
    // console.log(usuario, contrasena, token);
    //const hash = crypto.createHash('sha256').update(contrasena).digest('hex');
    // Verificar si el token proporcionado es válido
    // const encryptedToken = encryptToken(token);
    const { usuario, contrasena } = req.body;

    if (!req.file) {
        return res.status(400).send('Imagen de rostro requerida');
    }
    try {
        // Realiza una solicitud al UserService para obtener el usuario por token
        const userResponse = await axios.get(`${userServiceURL}/getUserByToken/${encryptedToken}`);
        const user = userResponse.data;
        //console.log(user);
        //console.log(user._id);
        if (user) {
            // Aquí asumimos que tus funciones de descifrado devuelven una promesa
            const usuarioDescifrado = await decryptText(user.usuario);
            const contrasenaDescifrada = await decryptText(user.contrasena);

            const contrasenaString = String(contrasenaDescifrada); // Esto se utiliza para poder hacer una cadena todas las contraseñas y poder comparlas luego

            if ( /*user.contrasena*/ contrasenaString === contrasena && /*user.usuario*/usuarioDescifrado === usuario) {
                console.log("Entro");
                const accessToken = generateAccessToken(usuarioDescifrado, user._id);
                console.log(accessToken + "Este es el token");
                res.cookie('token', accessToken, { httpOnly: true });
                console.log(user._id + "Este es el id del usuario")
                return res.status(200).json({
                    message: 'Inicio de sesión exitoso',
                    token: accessToken,
                    userId: user._id  // Envía el _id del usuario
                });
            } else {
                return res.status(401).json({ message: 'Credenciales inválidas' });
            }
        } else {
            res.status(401).json({ message: 'No existe el Usuario' });
        }

    } catch (err) {
        console.error(err);
        res.status(err.response?.status || 500).json({ message: err.message || 'Error en el servidor' });
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