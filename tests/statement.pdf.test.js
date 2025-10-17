const request = require('supertest');

// Mock auth
jest.mock('../middlewares/auth-middleware', () => ({
  requireAuth: (req, res, next) => { res.locals.user = mock.user; next(); },
  checkUser: (req, res, next) => { res.locals.user = mock.user; next(); }
}));

// Mock DB
jest.mock('../data/database', () => ({
  connectToDatabase: jest.fn().mockResolvedValue(),
  getDb: jest.fn(() => ({
    collection: (name) => {
      if (name === 'Users') {
        return {
          findOne: jest.fn(async () => mock.user),
          find: jest.fn(() => ({ toArray: async () => [{ _id: 'u1', name: mock.user.name, email: mock.user.email }] })),
        };
      }
      if (name === 'Accounts') {
        return {
          findOne: jest.fn(async () => ({ _id: 'a1', accountNumber: 'MHCA-ABCDEFGH', userId: 'u1', balance: 500 })),
          find: jest.fn(() => ({ toArray: async () => [{ accountNumber: 'MHCA-ABCDEFGH', userId: 'u1' }] })),
        };
      }
      if (name === 'Transactions') {
        return { find: jest.fn(() => ({ toArray: async () => mock.transactions })) };
      }
      return {};
    }
  })),
}));

process.env.SESSION_SECRET = 'test';
process.env.JWT_SECRET = 'test';
process.env.NODE_ENV = 'test';

const app = require('../app');

const mock = {
  user: { _id: '507f1f77bcf86cd799439011', email: 'user@example.com', name: 'Test User', isVerified: true },
  transactions: [
    { _id: 't1', transactionType: 'Deposit', amount: 100, date: new Date().toISOString(), senderAccountNumber: 'MHCA-ABCDEFGH', receiverAccountNumber: 'MHCA-ABCDEFGH' },
  ],
};

describe('Statement & PDF', () => {
  it('GET /statement renders HTML', async () => {
    const res = await request(app).get('/statement');
    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/Financial Statement|Statement/i);
  });

  it('GET /statement/generate-pdf returns a PDF', async () => {
    const res = await request(app).get('/statement/generate-pdf');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
    expect(res.headers['content-disposition']).toMatch(/attachment/);
  });
});
