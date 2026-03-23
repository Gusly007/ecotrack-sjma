import { jest } from '@jest/globals';

const mockRequirePermission = jest.fn();
const mockHasPermission = jest.fn();

jest.unstable_mockModule('../../src/middleware/rbac.js', () => ({
  requirePermission: mockRequirePermission,
  hasPermission: mockHasPermission,
  requirePermissions: jest.fn()
}));

const { hasPermission } = await import('../../src/middleware/rbac.js');

describe('RBAC Middleware - Gamifications', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  describe('Permissions par rôle - Gamification', () => {
    describe('CITOYEN', () => {
      it('devrait avoir gamification:read', () => {
        mockHasPermission.mockReturnValueOnce(true);
        expect(hasPermission('CITOYEN', 'gamification:read')).toBe(true);
      });

      it('devrait avoir badges:read', () => {
        mockHasPermission.mockReturnValueOnce(true);
        expect(hasPermission('CITOYEN', 'badges:read')).toBe(true);
      });

      it('devrait avoir defis:read', () => {
        mockHasPermission.mockReturnValueOnce(true);
        expect(hasPermission('CITOYEN', 'defis:read')).toBe(true);
      });

      it('devrait avoir points:read', () => {
        mockHasPermission.mockReturnValueOnce(true);
        expect(hasPermission('CITOYEN', 'points:read')).toBe(true);
      });

      it('devrait avoir classement:read', () => {
        mockHasPermission.mockReturnValueOnce(true);
        expect(hasPermission('CITOYEN', 'classement:read')).toBe(true);
      });

      it('ne devrait pas avoir gamification:create', () => {
        mockHasPermission.mockReturnValueOnce(false);
        expect(hasPermission('CITOYEN', 'gamification:create')).toBe(false);
      });

      it('ne devrait pas avoir defis:create', () => {
        mockHasPermission.mockReturnValueOnce(false);
        expect(hasPermission('CITOYEN', 'defis:create')).toBe(false);
      });

      it('ne devrait pas avoir badges:create', () => {
        mockHasPermission.mockReturnValueOnce(false);
        expect(hasPermission('CITOYEN', 'badges:create')).toBe(false);
      });
    });

    describe('AGENT', () => {
      it('devrait avoir gamification:read', () => {
        mockHasPermission.mockReturnValueOnce(true);
        expect(hasPermission('AGENT', 'gamification:read')).toBe(true);
      });

      it('devrait avoir badges:read', () => {
        mockHasPermission.mockReturnValueOnce(true);
        expect(hasPermission('AGENT', 'badges:read')).toBe(true);
      });

      it('devrait avoir defis:read', () => {
        mockHasPermission.mockReturnValueOnce(true);
        expect(hasPermission('AGENT', 'defis:read')).toBe(true);
      });

      it('devrait avoir points:read', () => {
        mockHasPermission.mockReturnValueOnce(true);
        expect(hasPermission('AGENT', 'points:read')).toBe(true);
      });

      it('devrait avoir classement:read', () => {
        mockHasPermission.mockReturnValueOnce(true);
        expect(hasPermission('AGENT', 'classement:read')).toBe(true);
      });

      it('ne devrait pas avoir gamification:create', () => {
        mockHasPermission.mockReturnValueOnce(false);
        expect(hasPermission('AGENT', 'gamification:create')).toBe(false);
      });
    });

    describe('GESTIONNAIRE', () => {
      it('devrait avoir toutes les permissions gamification', () => {
        const permissions = [
          'gamification:read', 'gamification:create', 'gamification:update', 'gamification:delete',
          'badges:read', 'badges:create', 'badges:update', 'badges:delete',
          'defis:read', 'defis:create', 'defis:update', 'defis:delete',
          'points:read', 'classement:read'
        ];
        
        permissions.forEach(perm => {
          mockHasPermission.mockReturnValueOnce(true);
          expect(hasPermission('GESTIONNAIRE', perm)).toBe(true);
        });
      });
    });

    describe('ADMIN', () => {
      it('devrait avoir toutes les permissions (wildcard)', () => {
        mockHasPermission.mockReturnValueOnce(true);
        expect(hasPermission('ADMIN', 'any:permission')).toBe(true);
      });
    });
  });

  describe('requirePermission - Endpoints', () => {
    const createMockMiddleware = () => {
      return (permission) => {
        return (req, res, next) => {
          if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
          }
          if (!mockHasPermission(req.user.role, permission)) {
            return res.status(403).json({ 
              error: 'Insufficient permissions',
              required: permission,
              role: req.user.role
            });
          }
          next();
        };
      };
    };

    describe('Endpoint /badges', () => {
      it('GET / devrait être accessible à CITOYEN (badges:read)', () => {
        mockReq = { user: { role: 'CITOYEN' } };
        mockHasPermission.mockReturnValue(true);
        
        const middleware = createMockMiddleware()('badges:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });

      it('POST / ne devrait pas être accessible à CITOYEN (badges:create)', () => {
        mockReq = { user: { role: 'CITOYEN' } };
        mockHasPermission.mockReturnValue(false);
        
        const middleware = createMockMiddleware()('badges:create');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockRes.status).toHaveBeenCalledWith(403);
      });

      it('POST / devrait être accessible à GESTIONNAIRE (badges:create)', () => {
        mockReq = { user: { role: 'GESTIONNAIRE' } };
        mockHasPermission.mockReturnValue(true);
        
        const middleware = createMockMiddleware()('badges:create');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('Endpoint /defis', () => {
      it('GET / devrait être accessible à CITOYEN (defis:read)', () => {
        mockReq = { user: { role: 'CITOYEN' } };
        mockHasPermission.mockReturnValue(true);
        
        const middleware = createMockMiddleware()('defis:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });

      it('POST / ne devrait pas être accessible à AGENT (defis:create)', () => {
        mockReq = { user: { role: 'AGENT' } };
        mockHasPermission.mockReturnValue(false);
        
        const middleware = createMockMiddleware()('defis:create');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockRes.status).toHaveBeenCalledWith(403);
      });

      it('POST / devrait être accessible à GESTIONNAIRE (defis:create)', () => {
        mockReq = { user: { role: 'GESTIONNAIRE' } };
        mockHasPermission.mockReturnValue(true);
        
        const middleware = createMockMiddleware()('defis:create');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('Endpoint /classement', () => {
      it('GET / devrait être accessible à tous les rôles connectés', () => {
        ['CITOYEN', 'AGENT', 'GESTIONNAIRE', 'ADMIN'].forEach(role => {
          mockReq = { user: { role } };
          mockHasPermission.mockReturnValue(true);
          
          const middleware = createMockMiddleware()('classement:read');
          middleware(mockReq, mockRes, mockNext);
          
          expect(mockNext).toHaveBeenCalled();
        });
      });
    });

    describe('Endpoint /actions', () => {
      it('POST / ne devrait pas être accessible à CITOYEN', () => {
        mockReq = { user: { role: 'CITOYEN' } };
        mockHasPermission.mockReturnValue(false);
        
        const middleware = createMockMiddleware()('gamification:create');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockRes.status).toHaveBeenCalledWith(403);
      });
    });

    describe('Sans authentication', () => {
      it('devrait retourner 401 sans req.user', () => {
        mockReq = { user: undefined };
        
        const middleware = createMockMiddleware()('gamification:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      });
    });
  });
});
