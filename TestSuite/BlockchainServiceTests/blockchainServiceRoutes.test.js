
const mockTransaccionSave = jest.fn();
jest.mock('../../BlockchainService/models/TransaccionesTangle', () => {
    return jest.fn().mockImplementation(() => {
        return { save: mockTransaccionSave };
    });
});

const request = require('supertest');
jest.mock('../../BlockchainService/db', () => jest.fn()); // Mockear la conexión a la base de datos
const app = require('../../BlockchainService/index'); 

describe('BlockchainService routes', () => {
    beforeAll(() => {
        
        mockTransaccionSave.mockClear();
    });

    test('GET / should return status code 200', async () => {
        const response = await request(app).get('/');
        expect(response.statusCode).toBe(200);
        expect(response.text).toContain('BlockchainService is running');
    });

    test('POST /upload should validate required fields and succeed', async () => {
        const mockData = {
            hash: "someHashValue", // Valor ficticio válido
            usuarioId: "507f1f77bcf86cd799439011", // Un ObjectId ficticio válido para propósitos de prueba
            azureBlobUrl: "http://example.com/blob" // URL ficticia válida
        };

        mockTransaccionSave.mockResolvedValue({
            _id: "65ad4b6b11a2592fb666d429", 
            ...mockData,
            fechaTransaccion: new Date(), 
        });

        const response = await request(app)
            .post('/upload')
            .send(mockData);

        expect(response.statusCode).toBe(200);
        expect(mockTransaccionSave).toHaveBeenCalled();
    });

    // Aquí puedes agregar más pruebas según sean necesarias
});