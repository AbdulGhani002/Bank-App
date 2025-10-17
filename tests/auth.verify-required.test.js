const request = require('supertest');
jest.mock('../data/database', () => ({
  connectToDatabase: jest.fn().mockResolvedValue(),
  getDb: jest.fn(() => ({
    collection: (name) => {
      if (name === 'Users') {
        // Store users here for test
        return {
          findOne: jest.fn(async (q) => {
            if (q.email) return mockState.userByEmail;
            if (q._id) return mockState.userById;
            if (q.verificationToken) return mockState.userByToken;
            return null;
          }),
          insertOne: jest.fn(async (doc) => {
            mockState.userByEmail = doc; mockState.userById = doc; mockState.userByToken = doc; return { insertedId: 'u1' };
          }),
          updateOne: jest.fn(async () => ({})),
        };
      }
      if (name === 'Accounts') {
        return {
          findOne: jest.fn(async (q) => {
            if (q.userId) return mockState.accountByUserId;
            if (q.accountNumber) return mockState.accountByNumber;
            return null;
          }),
          find: jest.fn(() => ({ toArray: async () => mockState.counterpartAccounts })),
          insertOne: jest.fn(async (doc) => { mockState.accountByUserId = { ...doc, _id: 'a1' }; mockState.accountByNumber = mockState.accountByUserId; return { insertedId: 'a1' }; }),
          updateOne: jest.fn(async () => ({})),
        };
      }
      if (name === 'Transactions') {
        return {
          insertOne: jest.fn(async (doc) => { mockState.transactions.push(doc); return { acknowledged: true }; }),
          find: jest.fn(() => ({ toArray: async () => mockState.transactions })),
          findOne: jest.fn(async () => mockState.transactions[0] || null),
        };
      }
      return {};
    }
  })),
}));

jest.mock('../utils/email', () => Object.assign(jest.fn(async () => {}), { verify: jest.fn(async () => ({ ok: true })) }));

process.env.SESSION_SECRET = 'test';
process.env.JWT_SECRET = 'test';
process.env.NODE_ENV = 'test';

const app = require('../app');
const bcrypt = require('bcryptjs');

// In-memory state across mocks
const mockState = {
  userByEmail: null,
  userById: null,
  userByToken: null,
  accountByUserId: null,
  accountByNumber: null,
  counterpartAccounts: [],
  transactions: [],
};

describe('Auth requires verification', () => {
  beforeEach(() => {
    // Reset
    mockState.userByEmail = null;
    mockState.userById = null;
    mockState.userByToken = null;
    mockState.accountByUserId = null;
    mockState.accountByNumber = null;
    mockState.counterpartAccounts = [];
    mockState.transactions = [];
  });

  it('blocks login if not verified', async () => {
    // Create a user (unverified) via signup call
    const hashed = await bcrypt.hash('secret123', 1);
    mockState.userByEmail = {
      _id: 'u1', email: 'u@test.com', password: hashed, isVerified: false
    };
    const res = await request(app)
      .post('/login')
      .type('form')
      .send({ email: 'u@test.com', password: 'secret123', _csrf: 'test-csrf-token' });

    expect(res.statusCode).toBe(401);
    expect(String(res.text)).toMatch(/not verified/i);
  });
});
