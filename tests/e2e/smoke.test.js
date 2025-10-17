const request = require('supertest');
jest.mock('../../data/database', () => ({
  connectToDatabase: jest.fn().mockResolvedValue(),
  getDb: jest.fn(() => ({ collection: () => ({ findOne: jest.fn(), }) })),
}));

process.env.SESSION_SECRET = 'test';
process.env.JWT_SECRET = 'test';

const app = require('../../app');

describe('Smoke', () => {
  it('boots and serves /', async () => {
    const res = await request(app).get('/');
    expect([200,302]).toContain(res.statusCode);
  });
});