const request = require('supertest');
const { encode } = require('punycode');
const url = 'https://homomorphicencryptionservice.luxen.club'; // Asegúrate de que esta es la URL correcta de tu servicio

describe('EncryptionService tests', () => {
    let encryptedText = '';

    test('Encrypt endpoint should encrypt text', async () => {
        const response = await request(url)
            .post('/Encryption/encrypt')
            .send({ plainText: 'test' }) // Ajusta este objeto si tu API espera un formato diferente
            // .expect('Content-Type', /application\/json/)
            .expect(200);

        expect(response.body).toHaveProperty('encryptedText');
        encryptedText = response.body.encryptedText;
        expect(encryptedText).not.toBe('test');
    });

    test('Decrypt endpoint should decrypt text', async () => {
        // Asegúrate de realizar primero la prueba de encriptación para tener el texto encriptado
        const response = await request(url)
            .post('/decrypt')
            .send({ cipherText: encryptedText }) // Ajusta este objeto si tu API espera un formato diferente
            // .expect('Content-Type', /application\/json/)
            .expect(200);

        expect(response.body).toHaveProperty('plainText');
        const decryptedText = response.body.plainText;
        expect(decryptedText).toBe('test');
    });

    // Añade más pruebas según sea necesario
});
