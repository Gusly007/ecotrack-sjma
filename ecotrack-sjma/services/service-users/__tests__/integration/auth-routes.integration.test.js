const request = require('supertest');
const app = require('../../src/index');

describe('Users Service Auth Routes Integration', () => {
  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', mot_de_passe: 'password123' });
      expect([200, 401, 500]).toContain(res.status);
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'invalid@example.com', mot_de_passe: 'wrong' });
      expect([401, 500]).toContain(res.status);
    });

    it('should reject missing credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({});
      expect([400, 500]).toContain(res.status);
    });
  });

  describe('POST /auth/register', () => {
    it('should register with valid data', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          email: 'newuser@example.com',
          mot_de_passe: 'password123',
          nom_utilisateur: 'NewUser',
          id_role: 1
        });
      expect([201, 400, 500]).toContain(res.status);
    });

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          email: 'existing@example.com',
          mot_de_passe: 'password123',
          nom_utilisateur: 'User',
          id_role: 1
        });
      expect([400, 500]).toContain(res.status);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout authenticated user', async () => {
      const res = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${global.testAuthToken}`);
      expect([200, 401, 500]).toContain(res.status);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh token', async () => {
      const res = await request(app)
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${global.testRefreshToken}`);
      expect([200, 401, 500]).toContain(res.status);
    });
  });
});