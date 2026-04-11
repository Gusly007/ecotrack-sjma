/**
 * Tests Unitaires - RBAC Middleware Routes
 * Tests des permissions RBAC pour service-routes
 */

const { requirePermission, requirePermissions, hasPermission } = require('../../../src/middleware/rbac');

describe('RBAC Middleware - Service Routes (Tournées)', () => {
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

  describe('hasPermission - Tournées', () => {
    describe('CITOYEN', () => {
      it('ne devrait pas avoir tournee:read', () => {
        expect(hasPermission('CITOYEN', 'tournee:read')).toBe(false);
      });

      it('ne devrait pas avoir tournee:create', () => {
        expect(hasPermission('CITOYEN', 'tournee:create')).toBe(false);
      });

      it('ne devrait pas avoir tournee:update', () => {
        expect(hasPermission('CITOYEN', 'tournee:update')).toBe(false);
      });

      it('ne devrait pas avoir tournee:delete', () => {
        expect(hasPermission('CITOYEN', 'tournee:delete')).toBe(false);
      });
    });

    describe('AGENT', () => {
      it('devrait avoir tournee:read', () => {
        expect(hasPermission('AGENT', 'tournee:read')).toBe(true);
      });

      it('devrait avoir tournee:update', () => {
        expect(hasPermission('AGENT', 'tournee:update')).toBe(true);
      });

      it('ne devrait pas avoir tournee:create', () => {
        expect(hasPermission('AGENT', 'tournee:create')).toBe(false);
      });

      it('ne devrait pas avoir tournee:delete', () => {
        expect(hasPermission('AGENT', 'tournee:delete')).toBe(false);
      });
    });

    describe('GESTIONNAIRE', () => {
      it('devrait avoir tournee:read', () => {
        expect(hasPermission('GESTIONNAIRE', 'tournee:read')).toBe(true);
      });

      it('devrait avoir tournee:create', () => {
        expect(hasPermission('GESTIONNAIRE', 'tournee:create')).toBe(true);
      });

      it('devrait avoir tournee:update', () => {
        expect(hasPermission('GESTIONNAIRE', 'tournee:update')).toBe(true);
      });

      it('devrait avoir tournee:delete', () => {
        expect(hasPermission('GESTIONNAIRE', 'tournee:delete')).toBe(true);
      });
    });

    describe('ADMIN', () => {
      it('devrait avoir toutes les permissions (wildcard)', () => {
        expect(hasPermission('ADMIN', 'tournee:read')).toBe(true);
        expect(hasPermission('ADMIN', 'tournee:create')).toBe(true);
        expect(hasPermission('ADMIN', 'tournee:update')).toBe(true);
        expect(hasPermission('ADMIN', 'tournee:delete')).toBe(true);
        expect(hasPermission('ADMIN', 'tournee:anything')).toBe(true);
      });
    });
  });

  describe('requirePermission - Endpoints Tournées', () => {
    describe('Lecture - GET /tournees', () => {
      it('ne devrait pas autoriser CITOYEN sur GET /tournees', () => {
        mockReq = { user: { role: 'CITOYEN' } };
        
        const middleware = requirePermission('tournee:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'Insufficient permissions',
          required: 'tournee:read',
          role: 'CITOYEN'
        });
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('devrait autoriser AGENT sur GET /tournees', () => {
        mockReq = { user: { role: 'AGENT' } };
        
        const middleware = requirePermission('tournee:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });

      it('devrait autoriser GESTIONNAIRE sur GET /tournees', () => {
        mockReq = { user: { role: 'GESTIONNAIRE' } };
        
        const middleware = requirePermission('tournee:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });

      it('devrait autoriser ADMIN sur GET /tournees', () => {
        mockReq = { user: { role: 'ADMIN' } };
        
        const middleware = requirePermission('tournee:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('Lecture - GET /tournees/active', () => {
      it('devrait autoriser AGENT sur GET /tournees/active', () => {
        mockReq = { user: { role: 'AGENT' } };
        
        const middleware = requirePermission('tournee:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });

      it('devrait autoriser GESTIONNAIRE sur GET /tournees/active', () => {
        mockReq = { user: { role: 'GESTIONNAIRE' } };
        
        const middleware = requirePermission('tournee:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('Lecture - GET /my-tournee (Agent)', () => {
      it('devrait autoriser AGENT sur GET /my-tournee', () => {
        mockReq = { user: { role: 'AGENT' } };
        
        const middleware = requirePermission('tournee:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });

      it('ne devrait pas autoriser CITOYEN sur GET /my-tournee', () => {
        mockReq = { user: { role: 'CITOYEN' } };
        
        const middleware = requirePermission('tournee:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockRes.status).toHaveBeenCalledWith(403);
      });
    });

    describe('Optimisation - POST /optimize', () => {
      it('devrait autoriser AGENT sur POST /optimize (lecture)', () => {
        mockReq = { user: { role: 'AGENT' } };
        
        const middleware = requirePermission('tournee:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });

      it('devrait autoriser GESTIONNAIRE sur POST /optimize (lecture)', () => {
        mockReq = { user: { role: 'GESTIONNAIRE' } };
        
        const middleware = requirePermission('tournee:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });

      it('ne devrait pas autoriser CITOYEN sur POST /optimize', () => {
        mockReq = { user: { role: 'CITOYEN' } };
        
        const middleware = requirePermission('tournee:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockRes.status).toHaveBeenCalledWith(403);
      });
    });

    describe('Création - POST /tournees', () => {
      it('ne devrait pas autoriser AGENT sur POST /tournees (create)', () => {
        mockReq = { user: { role: 'AGENT' } };
        
        const middleware = requirePermission('tournee:create');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'Insufficient permissions',
          required: 'tournee:create',
          role: 'AGENT'
        });
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('devrait autoriser GESTIONNAIRE sur POST /tournees', () => {
        mockReq = { user: { role: 'GESTIONNAIRE' } };
        
        const middleware = requirePermission('tournee:create');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });

      it('devrait autoriser ADMIN sur POST /tournees', () => {
        mockReq = { user: { role: 'ADMIN' } };
        
        const middleware = requirePermission('tournee:create');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('Modification - PATCH /tournees/:id', () => {
      it('ne devrait pas autoriser CITOYEN sur PATCH /tournees/:id', () => {
        mockReq = { user: { role: 'CITOYEN' } };
        
        const middleware = requirePermission('tournee:update');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockRes.status).toHaveBeenCalledWith(403);
      });

      it('devrait autoriser AGENT sur PATCH /tournees/:id', () => {
        mockReq = { user: { role: 'AGENT' } };
        
        const middleware = requirePermission('tournee:update');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });

      it('devrait autoriser GESTIONNAIRE sur PATCH /tournees/:id', () => {
        mockReq = { user: { role: 'GESTIONNAIRE' } };
        
        const middleware = requirePermission('tournee:update');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('Suppression - DELETE /tournees/:id', () => {
      it('ne devrait pas autoriser AGENT sur DELETE /tournees/:id', () => {
        mockReq = { user: { role: 'AGENT' } };
        
        const middleware = requirePermission('tournee:delete');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockRes.status).toHaveBeenCalledWith(403);
      });

      it('devrait autoriser GESTIONNAIRE sur DELETE /tournees/:id', () => {
        mockReq = { user: { role: 'GESTIONNAIRE' } };
        
        const middleware = requirePermission('tournee:delete');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });

      it('devrait autoriser ADMIN sur DELETE /tournees/:id', () => {
        mockReq = { user: { role: 'ADMIN' } };
        
        const middleware = requirePermission('tournee:delete');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('Statut - PATCH /tournees/:id/statut', () => {
      it('devrait autoriser AGENT sur PATCH /tournees/:id/statut', () => {
        mockReq = { user: { role: 'AGENT' } };
        
        const middleware = requirePermission('tournee:update');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });

      it('ne devrait pas autoriser CITOYEN sur PATCH /tournees/:id/statut', () => {
        mockReq = { user: { role: 'CITOYEN' } };
        
        const middleware = requirePermission('tournee:update');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockRes.status).toHaveBeenCalledWith(403);
      });
    });

    describe('Détails - GET /tournees/:id', () => {
      it('devrait autoriser AGENT sur GET /tournees/:id', () => {
        mockReq = { user: { role: 'AGENT' } };
        
        const middleware = requirePermission('tournee:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });

      it('devrait autoriser GESTIONNAIRE sur GET /tournees/:id', () => {
        mockReq = { user: { role: 'GESTIONNAIRE' } };
        
        const middleware = requirePermission('tournee:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('Étapes - GET /tournees/:id/etapes', () => {
      it('devrait autoriser AGENT sur GET /tournees/:id/etapes', () => {
        mockReq = { user: { role: 'AGENT' } };
        
        const middleware = requirePermission('tournee:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('Progression - GET /tournees/:id/progress', () => {
      it('devrait autoriser AGENT sur GET /tournees/:id/progress', () => {
        mockReq = { user: { role: 'AGENT' } };
        
        const middleware = requirePermission('tournee:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('PDF - GET /tournees/:id/pdf', () => {
      it('devrait autoriser AGENT sur GET /tournees/:id/pdf', () => {
        mockReq = { user: { role: 'AGENT' } };
        
        const middleware = requirePermission('tournee:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });

      it('devrait autoriser GESTIONNAIRE sur GET /tournees/:id/pdf', () => {
        mockReq = { user: { role: 'GESTIONNAIRE' } };
        
        const middleware = requirePermission('tournee:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('Map - GET /tournees/:id/map', () => {
      it('devrait autoriser AGENT sur GET /tournees/:id/map', () => {
        mockReq = { user: { role: 'AGENT' } };
        
        const middleware = requirePermission('tournee:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });
    });
  });

  describe('Erreurs RBAC', () => {
    it('devrait retourner 401 sans utilisateur', () => {
      mockReq = { user: undefined };
      
      const middleware = requirePermission('tournee:read');
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('devrait retourner 403 pour CITOYEN tentant tournee:read', () => {
      mockReq = { user: { role: 'CITOYEN' } };
      
      const middleware = requirePermission('tournee:read');
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions',
        required: 'tournee:read',
        role: 'CITOYEN'
      });
    });
  });

  describe('Tableau de bord des permissions Tournées', () => {
    const endpointsTournées = [
      { method: 'GET', path: '/tournees', permission: 'tournee:read', rolesAutorises: ['AGENT', 'GESTIONNAIRE', 'ADMIN'] },
      { method: 'GET', path: '/tournees/active', permission: 'tournee:read', rolesAutorises: ['AGENT', 'GESTIONNAIRE', 'ADMIN'] },
      { method: 'GET', path: '/my-tournee', permission: 'tournee:read', rolesAutorises: ['AGENT', 'GESTIONNAIRE', 'ADMIN'] },
      { method: 'POST', path: '/optimize', permission: 'tournee:read', rolesAutorises: ['AGENT', 'GESTIONNAIRE', 'ADMIN'] },
      { method: 'POST', path: '/tournees', permission: 'tournee:create', rolesAutorises: ['GESTIONNAIRE', 'ADMIN'] },
      { method: 'GET', path: '/tournees/:id', permission: 'tournee:read', rolesAutorises: ['AGENT', 'GESTIONNAIRE', 'ADMIN'] },
      { method: 'PATCH', path: '/tournees/:id', permission: 'tournee:update', rolesAutorises: ['AGENT', 'GESTIONNAIRE', 'ADMIN'] },
      { method: 'PATCH', path: '/tournees/:id/statut', permission: 'tournee:update', rolesAutorises: ['AGENT', 'GESTIONNAIRE', 'ADMIN'] },
      { method: 'DELETE', path: '/tournees/:id', permission: 'tournee:delete', rolesAutorises: ['GESTIONNAIRE', 'ADMIN'] },
      { method: 'GET', path: '/tournees/:id/etapes', permission: 'tournee:read', rolesAutorises: ['AGENT', 'GESTIONNAIRE', 'ADMIN'] },
      { method: 'GET', path: '/tournees/:id/progress', permission: 'tournee:read', rolesAutorises: ['AGENT', 'GESTIONNAIRE', 'ADMIN'] },
      { method: 'GET', path: '/tournees/:id/pdf', permission: 'tournee:read', rolesAutorises: ['AGENT', 'GESTIONNAIRE', 'ADMIN'] },
      { method: 'GET', path: '/tournees/:id/map', permission: 'tournee:read', rolesAutorises: ['AGENT', 'GESTIONNAIRE', 'ADMIN'] },
    ];

    const tousLesRoles = ['CITOYEN', 'AGENT', 'GESTIONNAIRE', 'ADMIN'];

    endpointsTournées.forEach(({ method, path, permission, rolesAutorises }) => {
      describe(`${method} ${path}`, () => {
        tousLesRoles.forEach(role => {
          if (rolesAutorises.includes(role)) {
            it(`devrait autoriser ${role}`, () => {
              mockReq = { user: { role } };
              
              const middleware = requirePermission(permission);
              middleware(mockReq, mockRes, mockNext);
              
              expect(mockNext).toHaveBeenCalled();
            });
          } else {
            it(`ne devrait pas autoriser ${role}`, () => {
              mockReq = { user: { role } };
              
              const middleware = requirePermission(permission);
              middleware(mockReq, mockRes, mockNext);
              
              expect(mockRes.status).toHaveBeenCalledWith(403);
              expect(mockNext).not.toHaveBeenCalled();
            });
          }
        });
      });
    });
  });
});
