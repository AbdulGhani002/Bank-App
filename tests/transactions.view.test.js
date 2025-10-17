const request = require('supertest');

// Stub auth to always authenticate and attach a user
jest.mock('../middlewares/auth-middleware', () => ({
  requireAuth: (req, res, next) => { res.locals.user = mock.user; next(); },
  checkUser: (req, res, next) => { res.locals.user = mock.user; next(); }
}));

// Mock database with support for find().toArray for Accounts and Users
jest.mock('../data/database', () => ({
  connectToDatabase: jest.fn().mockResolvedValue(),
  getDb: jest.fn(() => ({
    collection: (name) => {
      if (name === 'Users') {
        return {
          findOne: jest.fn(async () => mock.user),
          find: jest.fn(() => ({ toArray: async () => [{ _id: 'u2', name: 'Counter User', email: 'counter@example.com' }] })),
        };
      }
      if (name === 'Accounts') {
        return {
          findOne: jest.fn(async (q) => ({ _id: 'a1', accountNumber: 'MHCA-ABCDEFGH', userId: mock.user._id, balance: 500 })),
          find: jest.fn(() => ({ toArray: async () => mock.counterparts })),
        };
      }
      if (name === 'Transactions') {
        return {
          find: jest.fn(() => ({ toArray: async () => mock.transactions })),
        };
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
  counterparts: [ { accountNumber: 'MHCA-XXXXYYYY', userId: 'u2' } ],
  transactions: [
    { transactionType: 'Payment', amount: 50, date: new Date().toISOString(), senderAccountNumber: 'MHCA-ABCDEFGH', receiverAccountNumber: 'MHCA-XXXXYYYY' },
    { transactionType: 'Deposit', amount: 100, date: new Date().toISOString(), senderAccountNumber: 'MHCA-ABCDEFGH', receiverAccountNumber: 'MHCA-ABCDEFGH' },
  ],
};

describe('Transactions view enrichment', () => {
  it('renders counterpart name and email when available', async () => {
    const res = await request(app).get('/transactions');
    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/Counter User/);
    expect(res.text).toMatch(/counter@example.com/);
  });
});
