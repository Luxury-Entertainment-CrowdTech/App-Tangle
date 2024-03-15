require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });
const crypto = require('crypto');
const axios = require('axios');
const https = require('https');
const jwt = require('jsonwebtoken');
const encryptionServiceURL = process.env.ENCRYPTION_SERVICE_URL;
const emailServiceURL = process.env.EMAIL_SERVICE_URL;

// Crea una instancia de Axios específicamente para entorno de producción o desarrollo
const axiosInstance = axios.create({
    httpsAgent: new https.Agent({
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    }),
    timeout: 300000, // Tiempo de espera de 10 segundos
  });

// Función para generar un token aleatorio
function generateSecureToken() {
    const tokenLength = 20;
    const possibleCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
    let token = '';

    // Generar un buffer de bytes aleatorios criptográficamente seguros
    let randomBytes = crypto.randomBytes(tokenLength);

    for (let i = 0; i < tokenLength; i++) {
        const randomIndex = randomBytes[i] % possibleCharacters.length;
        token += possibleCharacters[randomIndex];
    }
    return token;
}

// Función para cifrar el token con SHA-256
function encryptToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

// Modificar la función sendTokenByEmail para usar EmailService
async function sendTokenByEmail(email, token) {
    try {
        await axios.post(`${emailServiceURL}/sendEmail`, { email, token });
        console.log('Email enviado con éxito');
    } catch (error) {
        console.error('Error al enviar el email:', error);
        throw error; // O maneja el error como prefieras
    }
}

function generateAccessToken(username, userId) {  // Asegúrate de incluir userId aquí
    const payload = {
        username,
        userId,  // incluye userId en el payload
        // ... otros datos que quieras incluir
    };
    const token = jwt.sign(payload, 'clave_secreta', { expiresIn: '1h' });  // asume que jwt es una instancia de jsonwebtoken
    console.log(token);
    return token;
}

async function encryptText(text) {
    console.log('Request body for encryption:', text);
    try {
        const response = await axiosInstance.post(`${process.env.ENCRYPTION_SERVICE_URL}/Encryption/encrypt`, {
          PlainText: text
        }, {
          headers: { 'Content-Type': 'application/json' }
        });
        // console.log('Encryption response:', response.data.encryptedText);
        return response.data.encryptedText;
      } catch (error) {
        console.error('Error during encryption:', error);
        // Manejo específico de errores, puede ser adaptado según necesidades
        if (error.response) {
          console.error('Error data:', error.response.data);
        }
        throw new Error('Failed to encrypt text');
      }
}

async function decryptText(encryptedText) {
    try {
        const response = await axiosInstance.post(`${process.env.ENCRYPTION_SERVICE_URL}/Encryption/decrypt`, {
          CipherTextString: encryptedText
        }, {
          headers: { 'Content-Type': 'application/json' }
        });
        console.log('Decryption response:', response.data.plainText);
        return response.data.plainText;
      } catch (error) {
        console.error('Error during decryption:', error);
        throw new Error('Failed to decrypt text');
      }
}

// Ejemplo de cómo utilizar las funciones
// async function runEncryptionDecryptionTest() {
//     try {
//       const encryptedText = await encryptText('Hello, World!');
//     //   console.log('Encrypted text:', encryptedText);
//       const decryptedText = await decryptText(encryptedText);
//       console.log('Decrypted text:', decryptedText);
//     } catch (error) {
//       console.error('An error occurred:', error.message);
//     }
//   }
  
// runEncryptionDecryptionTest();

module.exports = {
    generateSecureToken,
    encryptToken,
    sendTokenByEmail,
    encryptText,
    decryptText,
    generateAccessToken,
};
