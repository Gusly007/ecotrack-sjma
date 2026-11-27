// SCRUM-5 : POST /auth/register est réservé à l'ADMIN (middleware d'auth réel).
jest.mock('../../src/services/authService.js', () => ({
  __esModule: true,
  registerUser: jest.fn(),
}));
jest.mock('../../src/services/userService.js', () => ({ __esModule: true }));
jest.mock('../../src/services/mfaService.js', () => ({ __esModule: true }));
jest.mock('../../src/controllers/sessionController.js', () => ({
  __esModule: true,
  refreshAccessToken: jest.fn(),
  logout: jest.fn(),
  logoutAll: jest.fn(),
}));
jest.mock('../../src/controllers/mfaController.js', () => ({
  __esModule: true,
  setup: jest.fn(),
  verify: jest.fn(),
  disable: jest.fn(),
  completeSetupAndLogin: jest.fn(),
  loginWithMfa: jest.fn(),
}));
jest.mock('../../src/config/rateLimit.js', () => {
  const passthrough = (req, res, next) => next();
  return {
    __esModule: true,
    publicLimiter: passthrough,
    loginLimiter: passthrough,
    passwordResetLimiter: passthrough,
  };
});

import { randomUUID } from 'node:crypto';
import express from 'express';
import request from 'supertest';
import env from '../../src/config/env.js';
import authRoutes from '../../src/routes/auth.js';
import * as authService from '../../src/services/authService.js';
import { generateToken } from '../../src/utils/jwt.js';

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

const body = {
  email: 'agent@example.com',
  nom: 'Dupont',
  prenom: 'Jean',
  password: 'password123',
  role: 'ADMIN',
};

describe('POST /auth/register (SCRUM-5)', () => {
  beforeAll(() => {
    jest.spyOn(env.jwt, 'secret', 'get').mockReturnValue(randomUUID());
  });

  afterAll(() => jest.restoreAllMocks());

  beforeEach(() => {
    jest.clearAllMocks();
    authService.registerUser.mockResolvedValue({
      user: { id_utilisateur: 9, email: body.email },
    });
  });

  it('refuse un appel anonyme avec role=ADMIN (401) sans créer de compte', async () => {
    const res = await request(app).post('/auth/register').send(body);

    expect(res.status).toBe(401);
    expect(authService.registerUser).not.toHaveBeenCalled();
  });

  it('refuse un jeton CITOYEN (403) sans créer de compte', async () => {
    const token = generateToken(1, 'CITOYEN');
    const res = await request(app)
      .post('/auth/register')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(403);
    expect(authService.registerUser).not.toHaveBeenCalled();
  });

  it('refuse un jeton GESTIONNAIRE (403) sans créer de compte', async () => {
    const token = generateToken(3, 'GESTIONNAIRE');
    const res = await request(app)
      .post('/auth/register')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(403);
    expect(authService.registerUser).not.toHaveBeenCalled();
  });

  it('refuse un jeton invalide (403) sans créer de compte', async () => {
    const res = await request(app)
      .post('/auth/register')
      .set('Authorization', 'Bearer pas-un-jwt')
      .send(body);

    expect(res.status).toBe(403);
    expect(authService.registerUser).not.toHaveBeenCalled();
  });

  it('accepte un jeton ADMIN pour tous les rôles (201) sans renvoyer de jeton', async () => {
    const token = generateToken(2, 'ADMIN');
    for (const role of ['CITOYEN', 'AGENT', 'GESTIONNAIRE', 'ADMIN']) {
      const res = await request(app)
        .post('/auth/register')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...body, role });

      expect(res.status).toBe(201);
      expect(authService.registerUser).toHaveBeenLastCalledWith(
        body.email, body.nom, body.prenom, body.password, role
      );
      expect(res.body.user).toBeDefined();
      expect(res.body.token).toBeUndefined();
      expect(res.body.refreshToken).toBeUndefined();
    }
  });
});
