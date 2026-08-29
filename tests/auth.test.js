const request = require('supertest');
const app = require('../app');

describe('Auth Endpoints', () => {
  const testEmail = `testuser_${Date.now()}@test.com`;
  const testPassword = 'password123';

  test('POST /api/auth/register creates a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail, password: testPassword });

    expect(res.statusCode).toBe(201);
    expect(res.body.user).toHaveProperty('email', testEmail);
    expect(res.body).toHaveProperty('token');
  });

  test('POST /api/auth/register rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail, password: testPassword });

    expect(res.statusCode).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  test('GET /api/profiles/me without token returns 401', async () => {
    const res = await request(app).get('/api/profiles/me');

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
});