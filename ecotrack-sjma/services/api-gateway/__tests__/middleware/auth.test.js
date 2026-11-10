import { jest } from '@jest/globals';

const mockVerify = jest.fn();

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    verify: mockVerify
  },
  verify: mockVerify
}));

const { jwtValidationMiddleware, requireRole, isAdminMonitoringRoute, ADMIN_MONITORING_ROUTES } =
  await import('../../src/middleware/auth.js');

describe('Auth Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    mockVerify.mockClear();
    
    req = {
      path: '/api/V1/users/profile',
      method: 'GET',
      headers: {},
      baseUrl: ''
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    next = jest.fn();
  });

  describe('jwtValidationMiddleware', () => {
    it('should skip validation for public routes', () => {
      // Test /auth/login
      req.path = '/auth/login';
      req.method = 'POST';
      jwtValidationMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();

      // Test /health
      req.path = '/health';
      req.method = 'GET';
      jwtValidationMiddleware(req, res, next);
      expect(next).toHaveBeenCalledTimes(2);

      // Test /api-docs
      req.path = '/api-docs';
      jwtValidationMiddleware(req, res, next);
      expect(next).toHaveBeenCalledTimes(3);
    });

    it('should skip validation for /auth/register (public route)', () => {
      req.path = '/auth/register';
      req.method = 'POST';
      jwtValidationMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should require auth for /api/V1/iot/sensors/status and forward the user', () => {
      req.path = '/api/V1/iot/sensors/status';

      jwtValidationMiddleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);

      // service-iot lit x-user-role : le gateway doit le renseigner sur cette route
      req.headers.authorization = 'Bearer valid_token';
      mockVerify.mockReturnValue({ userId: 7, role: 'GESTIONNAIRE' });

      jwtValidationMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.headers['x-user-role']).toBe('GESTIONNAIRE');
    });

    it('should return 401 if authorization header is missing', () => {
      jwtValidationMiddleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Token JWT manquant'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if authorization format is invalid', () => {
      req.headers.authorization = 'InvalidFormat token123';
      
      jwtValidationMiddleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Format de token invalide. Utilisez: Bearer <token>'
      });
    });

    it('should return 401 if token is expired', () => {
      req.headers.authorization = 'Bearer expired_token';
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      mockVerify.mockImplementation(() => {
        throw error;
      });
      
      jwtValidationMiddleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Token expiré'
      });
    });

    it('should return 401 if token is invalid', () => {
      req.headers.authorization = 'Bearer invalid_token';
      mockVerify.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      jwtValidationMiddleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Token invalide'
      });
    });

    it('should add user info to request and call next for valid token', () => {
      req.headers.authorization = 'Bearer valid_token';
      const decodedToken = {
        userId: 123,
        role: 'CITOYEN',
        email: 'test@example.com'
      };
      mockVerify.mockReturnValue(decodedToken);
      
      jwtValidationMiddleware(req, res, next);
      
      expect(req.user).toEqual({
        id: 123,
        role: 'CITOYEN',
        email: 'test@example.com'
      });
      expect(req.headers['x-user-id']).toBe(123);
      expect(req.headers['x-user-role']).toBe('CITOYEN');
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle token with id instead of userId', () => {
      req.headers.authorization = 'Bearer valid_token';
      const decodedToken = {
        id: 456,
        role: 'ADMIN'
      };
      mockVerify.mockReturnValue(decodedToken);
      
      jwtValidationMiddleware(req, res, next);
      
      expect(req.user.id).toBe(456);
      expect(req.headers['x-user-id']).toBe(456);
    });
  });

  describe('requireRole', () => {
    beforeEach(() => {
      req.headers.authorization = 'Bearer valid_token';
      mockVerify.mockReturnValue({
        userId: 123,
        role: 'CITOYEN'
      });
      jwtValidationMiddleware(req, res, next);
      jest.clearAllMocks();
    });

    it('should return 401 if user is not authenticated', () => {
      const reqWithoutUser = {
        path: '/api/V1/admin',
        method: 'GET',
        headers: {}
      };
      
      const middleware = requireRole('ADMIN');
      middleware(reqWithoutUser, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Authentification requise'
      });
    });

    it('should return 403 if user does not have required role', () => {
      req.user = { id: 123, role: 'CITOYEN' };
      
      const middleware = requireRole('ADMIN', 'GESTIONNAIRE');
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'Accès refusé. Rôles requis: ADMIN, GESTIONNAIRE'
      });
    });

    it('should call next if user has required role', () => {
      req.user = { id: 123, role: 'ADMIN' };
      
      const middleware = requireRole('ADMIN');
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should call next if user has one of multiple required roles', () => {
      req.user = { id: 123, role: 'GESTIONNAIRE' };
      
      const middleware = requireRole('ADMIN', 'GESTIONNAIRE', 'AGENT');
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
  });

  // ces six endpoints alimentent l'écran d'ensemble /admin. Ils
  // étaient listés dans publicRoutes et donc accessibles sans le moindre
  // jeton. Ils doivent désormais exiger une authentification.
  describe('endpoints de monitoring admin (V2-004)', () => {
    const MONITORING_PATHS = [
      '/api/V1/health/all',
      '/api/V1/metrics/status',
      '/api/V1/alerts',
      '/api/V1/dashboard/stats',
      '/api/V1/analytics',
      '/api/V1/iot/sensors/status',
    ];

    it.each(MONITORING_PATHS)('refuse sans token : %s', (path) => {
      req.path = path;
      req.method = 'GET';
      req.headers = {};

      jwtValidationMiddleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Token JWT manquant',
      });
    });

    it.each(MONITORING_PATHS)('accepte un ADMIN authentifié : %s', (path) => {
      req.path = path;
      req.method = 'GET';
      req.headers = { authorization: 'Bearer valid_token' };
      mockVerify.mockReturnValue({ userId: 1, role: 'ADMIN' });

      jwtValidationMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.headers['x-user-role']).toBe('ADMIN');
    });

    it.each(MONITORING_PATHS)('accepte un GESTIONNAIRE authentifié : %s', (path) => {
      req.path = path;
      req.method = 'GET';
      req.headers = { authorization: 'Bearer valid_token' };
      mockVerify.mockReturnValue({ userId: 2, role: 'GESTIONNAIRE' });

      jwtValidationMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it.each(MONITORING_PATHS)('refuse un AGENT authentifié : %s', (path) => {
      req.path = path;
      req.method = 'GET';
      req.headers = { authorization: 'Bearer valid_token' };
      mockVerify.mockReturnValue({ userId: 3, role: 'AGENT' });

      jwtValidationMiddleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'Accès refusé. Rôles requis: ADMIN, GESTIONNAIRE',
      });
    });

    it.each(MONITORING_PATHS)('refuse un CITOYEN authentifié : %s', (path) => {
      req.path = path;
      req.method = 'GET';
      req.headers = { authorization: 'Bearer valid_token' };
      mockVerify.mockReturnValue({ userId: 4, role: 'CITOYEN' });

      jwtValidationMiddleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('expose la liste des routes surveillées', () => {
      expect(ADMIN_MONITORING_ROUTES).toEqual(MONITORING_PATHS);
    });

    it('isAdminMonitoringRoute reconnaît les sous-chemins', () => {
      expect(isAdminMonitoringRoute('/api/V1/analytics/overview')).toBe(true);
      expect(isAdminMonitoringRoute('/api/V1/analytics')).toBe(true);
      expect(isAdminMonitoringRoute('/api/V1/analyticsXYZ')).toBe(false);
      expect(isAdminMonitoringRoute('/api/V1/users/profile')).toBe(false);
    });

    it('laisse les autres routes protégées inchangées pour un AGENT', () => {
      req.path = '/api/V1/routes/tournees';
      req.method = 'GET';
      req.headers = { authorization: 'Bearer valid_token' };
      mockVerify.mockReturnValue({ userId: 3, role: 'AGENT' });

      jwtValidationMiddleware(req, res, next);

      // Hors monitoring, le gateway ne filtre pas le rôle : il laisse passer,
      // le service consommateur applique ses propres permissions.
      expect(next).toHaveBeenCalled();
    });
  });
});
