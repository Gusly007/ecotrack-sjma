// V2-011 — non-régression au niveau HTTP.
// POST /auth/forgot-password doit renvoyer une réponse rigoureusement identique
// (statut + corps) pour un email existant et un email inconnu, et ne doit
// jamais exposer resetToken hors environnement isolé.

jest.mock('../../src/config/rateLimit.js', () => ({
  __esModule: true,
  publicLimiter: (req, res, next) => next(),
  loginLimiter: (req, res, next) => next(),
  passwordResetLimiter: (req, res, next) => next(),
}));

jest.mock('../../src/utils/logger.js', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../src/repositories/auth.repository.js', () => ({
  __esModule: true,
  AuthRepository: {
    findUserByEmail: jest.fn(),
    createPasswordResetToken: jest.fn(),
    findUserByIdWithMfa: jest.fn(),
    updateUserMfaSetupSecret: jest.fn(),
  },
}));

jest.mock('../../src/services/emailService.js', () => ({
  __esModule: true,
  sendPasswordResetEmail: jest.fn(),
  sendAdminCreatedUserEmail: jest.fn(),
  sendCitoyenActivationEmail: jest.fn(),
}));

jest.mock('../../src/services/auditService.js', () => ({
  __esModule: true,
  logLoginAttempt: jest.fn(),
  logAction: jest.fn(),
}));

jest.mock('../../src/services/sessionService.js', () => ({
  __esModule: true,
  limitConcurrentSessions: jest.fn(),
}));

import express from 'express';
import request from 'supertest';
import authRouter from '../../src/routes/auth.js';
import { AuthRepository } from '../../src/repositories/auth.repository.js';
import { sendPasswordResetEmail } from '../../src/services/emailService.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/auth', authRouter);
  app.use(errorHandler);
  return app;
};

const GENERIC = 'Si un compte est associé à cette adresse, un lien de réinitialisation a été envoyé.';

describe('POST /auth/forgot-password — anti-énumération (HTTP)', () => {
  const originalEnv = process.env;
  let app;

  beforeAll(() => {
    app = buildApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, NODE_ENV: 'production' };
    delete process.env.ALLOW_RESET_TOKEN_PREVIEW;
    sendPasswordResetEmail.mockResolvedValue({
      success: true,
      previewUrl: 'https://ethereal.email/message/abc',
    });
    AuthRepository.createPasswordResetToken.mockResolvedValue(undefined);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('renvoie un statut et un corps identiques pour un email connu et inconnu', async () => {
    AuthRepository.findUserByEmail.mockResolvedValueOnce({
      id_utilisateur: 1,
      email: 'existe@ecotrack.fr',
    });
    const known = await request(app)
      .post('/auth/forgot-password')
      .send({ email: 'existe@ecotrack.fr' });

    AuthRepository.findUserByEmail.mockResolvedValueOnce(null);
    const unknown = await request(app)
      .post('/auth/forgot-password')
      .send({ email: 'inconnu@ecotrack.fr' });

    expect(known.status).toBe(200);
    expect(unknown.status).toBe(200);
    expect(known.status).toBe(unknown.status);
    expect(known.body).toEqual({ message: GENERIC });
    expect(unknown.body).toEqual(known.body);
  });

  it('ne renvoie jamais 404 pour un email inconnu', async () => {
    AuthRepository.findUserByEmail.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/auth/forgot-password')
      .send({ email: 'personne@nowhere.test' });

    expect(res.status).not.toBe(404);
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toMatch(/aucun compte/i);
    expect(JSON.stringify(res.body)).not.toMatch(/introuvable/i);
  });

  it('n\'expose jamais resetToken ni previewUrl en production', async () => {
    AuthRepository.findUserByEmail.mockResolvedValueOnce({
      id_utilisateur: 1,
      email: 'existe@ecotrack.fr',
    });

    const res = await request(app)
      .post('/auth/forgot-password')
      .send({ email: 'existe@ecotrack.fr' });

    expect(res.body.resetToken).toBeUndefined();
    expect(res.body.previewUrl).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toMatch(/[a-f0-9]{64}/);
  });

  it('le paramètre `from=citoyen` ne change pas la forme de la réponse', async () => {
    AuthRepository.findUserByEmail.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/auth/forgot-password')
      .send({ email: 'inconnu@ecotrack.fr', from: 'citoyen' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: GENERIC });
  });

  it('un email vide reste un 400 clair (validation, pas énumération)', async () => {
    const res = await request(app).post('/auth/forgot-password').send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Email requis');
  });

  it('une panne SMTP ne révèle pas l\'existence du compte', async () => {
    AuthRepository.findUserByEmail.mockResolvedValueOnce({
      id_utilisateur: 1,
      email: 'existe@ecotrack.fr',
    });
    // sendEmail renvoie { success: false } ; le service ne doit pas propager
    sendPasswordResetEmail.mockResolvedValueOnce({ success: false, error: 'SMTP down' });

    const res = await request(app)
      .post('/auth/forgot-password')
      .send({ email: 'existe@ecotrack.fr' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: GENERIC });
  });
});