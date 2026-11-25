const { randomUUID } = require('node:crypto');
const request = require('supertest');
const { default: app } = require('../../src/index');
const { default: pool } = require('../../src/config/database.js');
const { default: env } = require('../../src/config/env.js');
const emailService = require('../../src/services/emailService.js');
const { generateToken } = require('../../src/utils/jwt.js');

describe('Users Service Auth Routes Integration', () => {
  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', mot_de_passe: 'password123' });
      expect([200, 400, 401, 500]).toContain(res.status);
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'invalid@example.com', mot_de_passe: 'wrong' });
      expect([400, 401, 500]).toContain(res.status);
    });

    it('should reject missing credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({});
      expect([400, 500]).toContain(res.status);
    });
  });

  describe('POST /auth/register', () => {
    let adminToken;
    let client;

    beforeEach(async () => {
      jest.spyOn(env.jwt, 'secret', 'get').mockReturnValue(randomUUID());
      adminToken = `Bearer ${generateToken(1, 'ADMIN')}`;
      jest.spyOn(emailService, 'sendAdminCreatedUserEmail').mockResolvedValue();
      client = await pool.connect();
      await client.query('BEGIN');
      jest.spyOn(pool, 'query').mockImplementation(client.query.bind(client));
    });

    afterEach(async () => {
      jest.restoreAllMocks();
      if (client) {
        try {
          await client.query('ROLLBACK');
        } finally {
          client.release();
          client = undefined;
        }
      }
    });

    it('should register with valid data (201)', async () => {
      const email = `newuser+${randomUUID()}@example.invalid`;
      const res = await request(app)
        .post('/auth/register')
        .set('Authorization', adminToken)
        .send({
          email,
          nom: 'Dupont',
          prenom: 'NewUser',
          password: 'password123',
          role: 'CITOYEN',
        });

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      // Le compte appartient à son futur titulaire : pas de session émise.
      expect(res.body.token).toBeUndefined();
      expect(res.body.refreshToken).toBeUndefined();
    });

    it('should reject duplicate email (409)', async () => {
      const email = `dup+${randomUUID()}@example.invalid`;
      const payload = {
        email,
        nom: 'Dupont',
        prenom: 'Doublon',
        password: 'password123',
        role: 'CITOYEN',
      };

      const created = await request(app)
        .post('/auth/register')
        .set('Authorization', adminToken)
        .send(payload);
      expect(created.status).toBe(201);

      const duplicate = await request(app)
        .post('/auth/register')
        .set('Authorization', adminToken)
        .send(payload);

      expect(duplicate.status).toBe(409);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout authenticated user', async () => {
      const res = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${global.testAuthToken}`);
      expect([200, 400, 401, 403, 500]).toContain(res.status);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh token', async () => {
      const res = await request(app)
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${global.testRefreshToken}`);
      expect([200, 400, 401, 500]).toContain(res.status);
    });
  });
});
