// TestSuite/AuthServiceTests/authUtils.test.js
const { generateRandomToken, encryptToken } = require('../../AuthService/authUtils');

describe('AuthUtils tests', () => {
    test('generateRandomToken should return a string', () => {
        const token = generateRandomToken();
        expect(typeof token).toBe('string');
    });

    test('generateRandomToken should return a non-empty string', () => {
        const token = generateRandomToken();
        expect(token.length).toBeGreaterThan(0);
    });

    test('encryptToken should return a hexadecimal string', () => {
        const rawToken = 'testtoken';
        const encryptedToken = encryptToken(rawToken);
        expect(encryptedToken).toMatch(/^[a-f0-9]{64}$/);
    });

    // Añadir más pruebas según sea necesario
});
