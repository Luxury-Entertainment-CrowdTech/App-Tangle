// EmailServiceTest/emailService.test.js
require('dotenv').config({ path: '../../EmailService/.env.test.secrets' });

jest.mock('@sendgrid/mail', () => ({
    setApiKey: jest.fn(),
    send: jest.fn().mockResolvedValue([{ statusCode: 202 }])
}));

const request = require('supertest');
const app = require('../../EmailService/index'); // Asegúrate de que la ruta sea correcta

describe('EmailService', () => {
    test('POST /sendEmail debe enviar un email y responder con éxito', async () => {
        const mockEmail = 'test@example.com';
        const mockToken = 'someRandomToken';

        // Realiza la petición POST al endpoint de tu servicio
        const response = await request(app).post('/sendEmail').send({
            email: mockEmail,
            token: mockToken,
        });

        // Verifica que el código de estado y el mensaje de respuesta sean los esperados
        expect(response.statusCode).toBe(200);
        expect(response.text).toContain('Email enviado con éxito');

        // Importa sgMail después de mockearlo para asegurarte de que el mock se aplica correctamente
        const sgMail = require('@sendgrid/mail');
        expect(sgMail.send).toHaveBeenCalledTimes(1);
    });
});