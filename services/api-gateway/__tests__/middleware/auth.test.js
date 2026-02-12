import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';

// Mock jwt
jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    verify: jest.fn()
  },
  verify: jest.fn()
}));

const { jwtValidationMiddleware, requireRole } = await import('../../src/middleware/auth.js');

describe('Auth Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    
    req = {
      path: '/api/users/profile',
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

      // Test /auth/register
      req.path = '/auth/register';
      jwtValidationMiddleware(req, res, next);
      expect(next).toHaveBeenCalledTimes(2);

      // Test /health
      req.path = '/health';
      req.method = 'GET';
      jwtValidationMiddleware(req, res, next);
      expect(next).toHaveBeenCalledTimes(3);

      // Test /api-docs
      req.path = '/api-docs';
      jwtValidationMiddleware(req, res, next);
      expect(next).toHaveBeenCalledTimes(4);
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
      jwt.verify.mockImplementation(() => {
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
      jwt.verify.mockImplementation(() => {
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
      jwt.verify.mockReturnValue(decodedToken);
      
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
      jwt.verify.mockReturnValue(decodedToken);
      
      jwtValidationMiddleware(req, res, next);
      
      expect(req.user.id).toBe(456);
      expect(req.headers['x-user-id']).toBe(456);
    });
  });

  describe('requireRole', () => {
    beforeEach(() => {
      req.headers.authorization = 'Bearer valid_token';
      jwt.verify.mockReturnValue({
        userId: 123,
        role: 'CITOYEN'
      });
      jwtValidationMiddleware(req, res, next);
      jest.clearAllMocks();
    });

    it('should return 401 if user is not authenticated', () => {
      const reqWithoutUser = {
        path: '/api/admin',
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
});
