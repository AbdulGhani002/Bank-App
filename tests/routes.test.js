const request = require('supertest');
jest.mock('../data/database', () => ({
  connectToDatabase: jest.fn().mockResolvedValue(),
  getDb: jest.fn(() => ({ collection: () => ({ findOne: jest.fn(), }) })),
}));

process.env.SESSION_SECRET = 'test';
process.env.JWT_SECRET = 'test';
process.env.ADMIN_EMAIL = 'admin@example.com';

const app = require('../app');

describe('Route availability', () => {
  it('GET / should redirect to /home or render index', async () => {
    const res = await request(app).get('/');
    expect([200, 302]).toContain(res.statusCode);
  });

  it('GET /routes requires auth and admin', async () => {
    const res = await request(app).get('/routes');
    expect([302,401,403]).toContain(res.statusCode);
  });
});