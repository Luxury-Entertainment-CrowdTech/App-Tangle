// TestSuite/AuthServiceTests/authServiceRoutes.test.js
const request = require('supertest');
const app = require('../../AuthService/index');

describe('AuthService routes', () => {
    test('GET / should return status code 200 and confirm service running', async () => {
        const response = await request(app).get('/');
        expect(response.statusCode).toBe(200);
        expect(response.text).toContain('AuthService is running');
    });

    // Añade mas pruebas para los otros endpoints
});
