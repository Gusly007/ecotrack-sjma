import * as sessionService from '../../src/services/sessionService.js';
import * as authService from '../../src/services/authService.js';
import * as jwt from '../../src/utils/jwt.js';
import * as auditService from '../../src/services/auditService.js';

jest.mock('../../src/services/sessionService.js');
jest.mock('../../src/services/authService.js');
jest.mock('../../src/services/auditService.js');

const createRequest = ({ body = {}, user = { id: 1 } } = {}) => ({
  body,
  user,
});

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

const createResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const verifyRefreshTokenSpy = jest.spyOn(jwt, 'verifyRefreshToken');
const next = jest.fn();
let refreshAccessToken;
let logout;
let logoutAll;

describe('Session Controller', () => {
  beforeAll(async () => {
    ({ refreshAccessToken, logout, logoutAll } = await import('../../src/controllers/sessionController.js'));
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    verifyRefreshTokenSpy.mockReset();
    next.mockReset();
  });

  afterAll(() => {
    verifyRefreshTokenSpy.mockRestore();
  });

  describe('refreshAccessToken', () => {
    it('returns 400 when refresh token is missing', async () => {
      const req = createRequest({ body: {} });
      const res = createResponse();

      await refreshAccessToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Refresh token required' });
      expect(sessionService.validateRefreshToken).not.toHaveBeenCalled();
    });

    it('rejects non refresh tokens', async () => {
      const req = createRequest({ body: { refreshToken: 'token' } });
      const res = createResponse();
      verifyRefreshTokenSpy.mockReturnValue({ type: 'access', id: 10 });

      await refreshAccessToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid refresh token' });
      expect(sessionService.validateRefreshToken).not.toHaveBeenCalled();
    });

    it('rejects expired or revoked refresh tokens', async () => {
      const req = createRequest({ body: { refreshToken: 'token' } });
      const res = createResponse();
      verifyRefreshTokenSpy.mockReturnValue({ type: 'refresh', id: 7 });
      sessionService.validateRefreshToken.mockResolvedValue(false);

      refreshAccessToken(req, res, next);
      await flushPromises();

      expect(sessionService.validateRefreshToken).toHaveBeenCalledWith(7, 'token');
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Refresh token expired or revoked' });
      expect(authService.getUserById).not.toHaveBeenCalled();
    });

    it('returns a new access token when refresh token is valid', async () => {
      const req = createRequest({ body: { refreshToken: 'token' } });
      const res = createResponse();
      verifyRefreshTokenSpy.mockReturnValue({ type: 'refresh', id: 5 });
      sessionService.validateRefreshToken.mockResolvedValue(true);
      authService.getUserById.mockResolvedValue({ id_utilisateur: 5, role_par_defaut: 'ADMIN' });

      refreshAccessToken(req, res, next);
      await flushPromises();

      expect(verifyRefreshTokenSpy).toHaveBeenCalledWith('token');
      expect(next).not.toHaveBeenCalled();
      expect(sessionService.validateRefreshToken).toHaveBeenCalledWith(5, 'token');
      expect(authService.getUserById).toHaveBeenCalledWith(5);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Token refreshed' }));
      const payload = res.json.mock.calls[0][0];
      expect(typeof payload.token).toBe('string');
    });
  });

  describe('logout', () => {
    it('invalidates provided refresh token and returns confirmation', async () => {
      const req = createRequest({ body: { refreshToken: 'token' }, user: { id: 12 } });
      const res = createResponse();

      logout(req, res, next);
      await flushPromises();

      expect(sessionService.invalidateRefreshToken).toHaveBeenCalledWith(12, 'token');
      expect(res.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
    });

    it('handles logout even when no refresh token is supplied', async () => {
      const req = createRequest({ body: {}, user: { id: 15 } });
      const res = createResponse();

      logout(req, res, next);
      await flushPromises();

      expect(sessionService.invalidateRefreshToken).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
    });
  });

  describe('logoutAll', () => {
    it('invalidates all user refresh tokens', async () => {
      const req = createRequest({ user: { id: 3 } });
      const res = createResponse();

      logoutAll(req, res, next);
      await flushPromises();

      expect(sessionService.invalidateAllTokens).toHaveBeenCalledWith(3);
      expect(res.json).toHaveBeenCalledWith({ message: 'Logged out from all devices' });
    });
  });
});
