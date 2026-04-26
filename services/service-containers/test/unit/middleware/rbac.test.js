/**
 * Tests Unitaires - RBAC Middleware
 * Tests des permissions RBAC par rôle et endpoint
 */

const { requirePermission, requirePermissions, hasPermission } = require('../../../src/middleware/rbac');

describe('RBAC Middleware - Unit Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('hasPermission', () => {
    describe('CITOYEN', () => {
      it('devrait avoir containers:read', () => {
        expect(hasPermission('CITOYEN', 'containers:read')).toBe(true);
      });

      it('ne devrait pas avoir containers:create', () => {
        expect(hasPermission('CITOYEN', 'containers:create')).toBe(false);
      });

      it('ne devrait pas avoir containers:update', () => {
        expect(hasPermission('CITOYEN', 'containers:update')).toBe(false);
      });

      it('ne devrait pas avoir containers:delete', () => {
        expect(hasPermission('CITOYEN', 'containers:delete')).toBe(false);
      });

      it('ne devrait pas avoir zone:create', () => {
        expect(hasPermission('CITOYEN', 'zone:create')).toBe(false);
      });

      it('ne devrait pas avoir zone:read', () => {
        expect(hasPermission('CITOYEN', 'zone:read')).toBe(false);
      });
    });

    describe('AGENT', () => {
      it('devrait avoir containers:read', () => {
        expect(hasPermission('AGENT', 'containers:read')).toBe(true);
      });

      it('devrait avoir containers:update', () => {
        expect(hasPermission('AGENT', 'containers:update')).toBe(true);
      });

      it('ne devrait pas avoir containers:create', () => {
        expect(hasPermission('AGENT', 'containers:create')).toBe(false);
      });

      it('ne devrait pas avoir containers:delete', () => {
        expect(hasPermission('AGENT', 'containers:delete')).toBe(false);
      });

      it('ne devrait pas avoir zone:create', () => {
        expect(hasPermission('AGENT', 'zone:create')).toBe(false);
      });
    });

    describe('GESTIONNAIRE', () => {
      it('devrait avoir containers:read', () => {
        expect(hasPermission('GESTIONNAIRE', 'containers:read')).toBe(true);
      });

      it('devrait avoir containers:create', () => {
        expect(hasPermission('GESTIONNAIRE', 'containers:create')).toBe(true);
      });

      it('devrait avoir containers:update', () => {
        expect(hasPermission('GESTIONNAIRE', 'containers:update')).toBe(true);
      });

      it('devrait avoir containers:delete', () => {
        expect(hasPermission('GESTIONNAIRE', 'containers:delete')).toBe(true);
      });

      it('devrait avoir zone:create', () => {
        expect(hasPermission('GESTIONNAIRE', 'zone:create')).toBe(true);
      });

      it('devrait avoir zone:read', () => {
        expect(hasPermission('GESTIONNAIRE', 'zone:read')).toBe(true);
      });

      it('devrait avoir zone:update', () => {
        expect(hasPermission('GESTIONNAIRE', 'zone:update')).toBe(true);
      });

      it('devrait avoir zone:delete', () => {
        expect(hasPermission('GESTIONNAIRE', 'zone:delete')).toBe(true);
      });
    });

    describe('ADMIN', () => {
      it('devrait avoir toutes les permissions (wildcard)', () => {
        expect(hasPermission('ADMIN', 'containers:read')).toBe(true);
        expect(hasPermission('ADMIN', 'containers:create')).toBe(true);
        expect(hasPermission('ADMIN', 'containers:update')).toBe(true);
        expect(hasPermission('ADMIN', 'containers:delete')).toBe(true);
        expect(hasPermission('ADMIN', 'zone:create')).toBe(true);
        expect(hasPermission('ADMIN', 'zone:delete')).toBe(true);
      });

      it('devrait avoir une permission inexistante (wildcard)', () => {
        expect(hasPermission('ADMIN', 'any:permission')).toBe(true);
      });
    });

    describe('Rôle Inconnu', () => {
      it('ne devrait avoir aucune permission', () => {
        expect(hasPermission('UNKNOWN', 'containers:read')).toBe(false);
      });

      it('ne devrait avoir aucune permission (null/undefined)', () => {
        expect(hasPermission(null, 'containers:read')).toBe(false);
        expect(hasPermission(undefined, 'containers:read')).toBe(false);
      });
    });
  });

  describe('requirePermission', () => {
    describe('Sans utilisateur (req.user manquant)', () => {
      it('devrait retourner 401 sans req.user', () => {
        mockReq = { user: undefined };
        
        const middleware = requirePermission('containers:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('Avec permission valide', () => {
      it('devrait appeler next() pour CITOYEN avec containers:read', () => {
        mockReq = { user: { role: 'CITOYEN' } };
        
        const middleware = requirePermission('containers:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
        expect(mockRes.status).not.toHaveBeenCalled();
      });

      it('devrait appeler next() pour GESTIONNAIRE avec zone:create', () => {
        mockReq = { user: { role: 'GESTIONNAIRE' } };
        
        const middleware = requirePermission('zone:create');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });

      it('devrait appeler next() pour ADMIN avec n\'importe quelle permission', () => {
        mockReq = { user: { role: 'ADMIN' } };
        
        const middleware = requirePermission('any:permission');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('Avec permission invalide', () => {
      it('devrait retourner 403 pour CITOYEN tentant containers:create', () => {
        mockReq = { user: { role: 'CITOYEN' } };
        
        const middleware = requirePermission('containers:create');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'Insufficient permissions',
          required: 'containers:create',
          role: 'CITOYEN'
        });
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('devrait retourner 403 pour AGENT tentant zone:create', () => {
        mockReq = { user: { role: 'AGENT' } };
        
        const middleware = requirePermission('zone:create');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'Insufficient permissions',
          required: 'zone:create',
          role: 'AGENT'
        });
      });

      it('devrait retourner 403 pour GESTIONNAIRE tentant containers:nonexistent', () => {
        mockReq = { user: { role: 'GESTIONNAIRE' } };
        
        const middleware = requirePermission('containers:nonexistent');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockRes.status).toHaveBeenCalledWith(403);
      });
    });
  });

  describe('requirePermissions (avec tableau)', () => {
    describe('Avec au moins une permission valide', () => {
      it('devrait appeler next() si une permission est valide', () => {
        mockReq = { user: { role: 'CITOYEN' } };
        
        const middleware = requirePermissions(['containers:read', 'zone:create']);
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });

      it('devrait appeler next() pour GESTIONNAIRE avec plusieurs permissions', () => {
        mockReq = { user: { role: 'GESTIONNAIRE' } };
        
        const middleware = requirePermissions(['zone:create', 'zone:delete']);
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('Sans permission valide', () => {
      it('devrait retourner 403 si aucune permission valide', () => {
        mockReq = { user: { role: 'CITOYEN' } };
        
        const middleware = requirePermissions(['zone:create', 'zone:delete']);
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'Insufficient permissions',
          required: ['zone:create', 'zone:delete'],
          role: 'CITOYEN'
        });
        expect(mockNext).not.toHaveBeenCalled();
      });
    });
  });
});
