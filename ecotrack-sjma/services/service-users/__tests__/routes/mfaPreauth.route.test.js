// V2-002 — non-régression : les routes MFA n'acceptent plus un userId fourni
// par le client. Sans jeton pré-MFA valide, elles répondent 401 ; un code faux
// ne doit plus générer ni renvoyer de secret.

// ESM Jest hoiste les factories jest.mock() au-dessus des const : le mock
// doit donc être créé par une factory, pas référencé depuis une variable.
const mockRepository = {
  findUserByEmail: jest.fn(),
  findUserById: jest.fn(),
  findUserByIdWithMfa: jest.fn(),
  updateMfaSettings: jest.fn(),
  updateUserMfaSetupSecret: jest.fn(),
  createPasswordResetToken: jest.fn(),
};
jest.mock('../../src/repositories/auth.repository.js', () => ({ __esModule: true, get AuthRepository() { return mockRepository; } }));

jest.mock('../../src/config/rateLimit.js', () => ({
  __esModule: true,
  publicLimiter: (req, res, next) => next(),
  loginLimiter: (req, res, next) => next(),
  passwordResetLimiter: (req, res, next) => next(),
}));

jest.mock('../../src/middleware/auth.js', () => {
  const actual = jest.requireActual('../../src/middleware/auth.js');
  return {
    __esModule: true,
    ...actual,
    authenticateToken: (req, res, next) => next(),
  };
});

jest.mock('../../src/utils/logger.js', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../src/services/mfaService.js', () => ({
  __esModule: true,
  generateMfaSetup: jest.fn(),
  generateQrCode: jest.fn(),
  verifyTotp: jest.fn(),
  verifyMfaCode: jest.fn(),
  enableMfa: jest.fn(),
  disableMfa: jest.fn(),
  saveSetupSecret: jest.fn(),
  isMfaEnabled: jest.fn(),
}));

jest.mock('../../src/services/sessionService.js', () => ({
  __esModule: true,
  storeRefreshToken: jest.fn(),
  limitConcurrentSessions: jest.fn(),
}));

jest.mock('../../src/services/auditService.js', () => ({
  __esModule: true,
  logLoginAttempt: jest.fn(),
  logAction: jest.fn(),
}));

import express from 'express';
import request from 'supertest';
import authRouter from '../../src/routes/auth.js';
import * as mfaService from '../../src/services/mfaService.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';
import { generateMfaToken, MFA_PURPOSES, verifyMfaToken } from '../../src/utils/mfaToken.js';

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/auth', authRouter);
  app.use(errorHandler);
  return app;
};

const agentUser = {
  id_utilisateur: 7,
  email: 'agent@ecotrack.fr',
  prenom: 'Agent',
  role_par_defaut: 'AGENT',
  mfa_enabled: true,
};

describe('V2-002 / jeton pré-MFA', () => {
  let app;

  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_v2_002';
    app = buildApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepository.findUserById.mockResolvedValue(agentUser);
    mockRepository.findUserByEmail.mockResolvedValue(null);
    mockRepository.findUserByIdWithMfa.mockResolvedValue({ ...agentUser, mfa_setup_secret: 'SECRETBASE32' });
    // getUserById passe par findUserByIdWithMfa : garder les deux alias cohérents.
    mockRepository.findUserById.mockImplementation((id) =>
      Promise.resolve(id === 7 ? agentUser : null));
    mockRepository.updateMfaSettings.mockResolvedValue(undefined);
    mockRepository.updateUserMfaSetupSecret.mockResolvedValue(undefined);
    mfaService.verifyTotp.mockReturnValue(true);
    mfaService.verifyMfaCode.mockResolvedValue({ valid: true, usedBackupCode: false });
    mfaService.generateMfaSetup.mockResolvedValue({ secret: 'NEWSECRET', qrCodeUrl: 'data:image/png;base64,QQ==' });
    mfaService.enableMfa.mockResolvedValue({ backupCodes: ['AAAA1111'] });
    mfaService.saveSetupSecret.mockResolvedValue(undefined);
  });

  describe('sans jeton pré-MFA, les trois routes répondent 401', () => {
    const cases = [
      ['/auth/mfa/regenerate', () => request(app).post('/auth/mfa/regenerate').send({ userId: 7 })],
      ['/auth/mfa/complete-setup', () => request(app).post('/auth/mfa/complete-setup').send({ userId: 7, code: '123456' })],
      ['/auth/login/mfa', () => request(app).post('/auth/login/mfa').send({ userId: 7, code: '123456' })],
    ];

    it.each(cases)('%s refuse un corps qui ne contient qu\'un userId', async (_name, send) => {
      const res = await send();
      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({ error: 'Jeton MFA requis' });
    });

    it.each(cases)('%s refuse un jeton falsifié', async (_name, send) => {
      const res = await send().set('X-MFA-Token', 'not-a-real-token');
      expect(res.status).toBe(401);
    });

    it.each(cases)('%s refuse un access token à la place du jeton MFA', async (_name, send) => {
      // Un access token a type: 'access' — il ne doit pas passer.
      const { generateToken } = await import('../../src/utils/jwt.js');
      const accessToken = generateToken(7, 'AGENT');
      const res = await send().set('X-MFA-Token', accessToken);
      expect(res.status).toBe(401);
    });
  });

  describe('purpose : un jeton de setup ne sert pas au login et inversement', () => {
    it('refuse un jeton SETUP sur /auth/login/mfa', async () => {
      const setupToken = generateMfaToken(7, MFA_PURPOSES.SETUP);
      const res = await request(app)
        .post('/auth/login/mfa')
        .set('X-MFA-Token', setupToken)
        .send({ code: '123456' });
      expect(res.status).toBe(401);
      expect(mfaService.verifyMfaCode).not.toHaveBeenCalled();
    });

    it('refuse un jeton LOGIN sur /auth/mfa/complete-setup', async () => {
      const loginToken = generateMfaToken(7, MFA_PURPOSES.LOGIN);
      const res = await request(app)
        .post('/auth/mfa/complete-setup')
        .set('X-MFA-Token', loginToken)
        .send({ code: '123456' });
      expect(res.status).toBe(401);
      expect(mfaService.verifyTotp).not.toHaveBeenCalled();
    });
  });

  describe('avec un jeton pré-MFA valide', () => {
    it('/auth/mfa/regenerate régénère le secret du porteur du jeton, pas du userId envoyé', async () => {
      const token = generateMfaToken(7, MFA_PURPOSES.SETUP);
      const res = await request(app)
        .post('/auth/mfa/regenerate')
        .set('X-MFA-Token', token)
        // userId d'un autre compte : doit être totalement ignoré.
        .send({ userId: 1 });

      expect(res.status).toBe(200);
      expect(res.body.secret).toBe('NEWSECRET');
      expect(mfaService.generateMfaSetup).toHaveBeenCalledWith(7, agentUser.email);
      // getUserById passe par findUserByIdWithMfa : c'est cet accès qui prouve
      // que seul l'id du jeton a été utilisé.
      expect(mockRepository.findUserByIdWithMfa).toHaveBeenCalledWith(7);
      expect(mockRepository.findUserByIdWithMfa).not.toHaveBeenCalledWith(1);
    });

    it('/auth/login/mfa accepte le code et délivre une session', async () => {
      const token = generateMfaToken(7, MFA_PURPOSES.LOGIN);
      const res = await request(app)
        .post('/auth/login/mfa')
        .set('X-MFA-Token', token)
        .send({ code: '123456' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeTruthy();
      expect(res.body.refreshToken).toBeTruthy();
      expect(mfaService.verifyMfaCode).toHaveBeenCalledWith(
        '123456',
        expect.objectContaining({ id_utilisateur: 7, email: agentUser.email })
      );
    });

    it('/auth/mfa/complete-setup active le MFA et délivre une session', async () => {
      const token = generateMfaToken(7, MFA_PURPOSES.SETUP);
      const res = await request(app)
        .post('/auth/mfa/complete-setup')
        .set('X-MFA-Token', token)
        .send({ code: '123456' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeTruthy();
      expect(mfaService.enableMfa).toHaveBeenCalledWith(7, 'SECRETBASE32');
      //  les codes de secours doivent être renvoyés une fois à
      // l'activation pour que l'utilisateur puisse les conserver.
      expect(res.body.backupCodes).toEqual(['AAAA1111']);
    });
  });

  describe('un code faux ne renvoie plus aucun secret', () => {
    it('/auth/login/mfa : 401 sec, pas de newMfaSetup ni de secret', async () => {
      mfaService.verifyMfaCode.mockResolvedValueOnce({ valid: false, usedBackupCode: false });
      const token = generateMfaToken(7, MFA_PURPOSES.LOGIN);

      const res = await request(app)
        .post('/auth/login/mfa')
        .set('X-MFA-Token', token)
        .send({ code: '000000' });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Code MFA invalide' });
      expect(res.body.newMfaSetup).toBeUndefined();
      expect(res.body.secret).toBeUndefined();
      expect(res.body.qrCodeUrl).toBeUndefined();
      // Aucune régénération de secret ne doit avoir eu lieu.
      expect(mfaService.generateMfaSetup).not.toHaveBeenCalled();
      expect(mfaService.saveSetupSecret).not.toHaveBeenCalled();
    });

    it('/auth/mfa/complete-setup : 401 sec sur code TOTP invalide', async () => {
      mfaService.verifyTotp.mockReturnValueOnce(false);
      const token = generateMfaToken(7, MFA_PURPOSES.SETUP);

      const res = await request(app)
        .post('/auth/mfa/complete-setup')
        .set('X-MFA-Token', token)
        .send({ code: '000000' });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Code MFA invalide' });
      expect(res.body.secret).toBeUndefined();
    });
  });

  describe('parcours de récupération par code de secours', () => {
    it('/auth/login/mfa accepte un code de secours et l\'annonce', async () => {
      mfaService.verifyMfaCode.mockResolvedValueOnce({ valid: true, usedBackupCode: true });
      const token = generateMfaToken(7, MFA_PURPOSES.LOGIN);

      const res = await request(app)
        .post('/auth/login/mfa')
        .set('X-MFA-Token', token)
        .send({ code: 'AAAA1111' });

      expect(res.status).toBe(200);
      expect(res.body.usedBackupCode).toBe(true);
      expect(res.body.token).toBeTruthy();
    });
  });
});

describe('V2-002 / verifyMfaToken', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_v2_002';
  });

  it('rejette un jeton dont le type n\'est pas mfa', async () => {
    const { generateToken } = await import('../../src/utils/jwt.js');
    const accessToken = generateToken(7, 'AGENT');
    expect(() => verifyMfaToken(accessToken, MFA_PURPOSES.LOGIN)).toThrow();
  });

  it('rejette un purpose inattendu', () => {
    const token = generateMfaToken(7, MFA_PURPOSES.SETUP);
    expect(() => verifyMfaToken(token, MFA_PURPOSES.LOGIN)).toThrow(/non autorisé/i);
  });

  it('accepte le purpose attendu et expose l\'id', () => {
    const token = generateMfaToken(7, MFA_PURPOSES.LOGIN);
    expect(verifyMfaToken(token, MFA_PURPOSES.LOGIN)).toMatchObject({ id: 7, purpose: MFA_PURPOSES.LOGIN });
  });
});