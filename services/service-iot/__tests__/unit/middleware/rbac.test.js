/**
 * Tests Unitaires - RBAC Middleware IoT
 * Tests des permissions RBAC pour service-iot
 */

const { requirePermission, requirePermissions, hasPermission } = require('../../../src/middleware/rbac');

describe('RBAC Middleware - Service IoT', () => {
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

  describe('hasPermission - IoT', () => {
    describe('CITOYEN', () => {
      it('devrait avoir iot:read', () => {
        expect(hasPermission('CITOYEN', 'iot:read')).toBe(true);
      });

      it('ne devrait pas avoir iot:update', () => {
        expect(hasPermission('CITOYEN', 'iot:update')).toBe(false);
      });
    });

    describe('AGENT', () => {
      it('devrait avoir iot:read', () => {
        expect(hasPermission('AGENT', 'iot:read')).toBe(true);
      });

      it('devrait avoir iot:update', () => {
        expect(hasPermission('AGENT', 'iot:update')).toBe(true);
      });
    });

    describe('GESTIONNAIRE', () => {
      it('devrait avoir iot:read', () => {
        expect(hasPermission('GESTIONNAIRE', 'iot:read')).toBe(true);
      });

      it('devrait avoir iot:update', () => {
        expect(hasPermission('GESTIONNAIRE', 'iot:update')).toBe(true);
      });
    });

    describe('ADMIN', () => {
      it('devrait avoir toutes les permissions (wildcard)', () => {
        expect(hasPermission('ADMIN', 'iot:read')).toBe(true);
        expect(hasPermission('ADMIN', 'iot:update')).toBe(true);
        expect(hasPermission('ADMIN', 'iot:anything')).toBe(true);
      });
    });
  });

  describe('requirePermission - Endpoints IoT', () => {
    describe('Mesures Endpoints', () => {
      it('devrait autoriser CITOYEN sur GET /iot/measurements', () => {
        mockReq = { user: { role: 'CITOYEN' } };
        
        const middleware = requirePermission('iot:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });

      it('devrait autoriser AGENT sur GET /iot/measurements', () => {
        mockReq = { user: { role: 'AGENT' } };
        
        const middleware = requirePermission('iot:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });

      it('devrait autoriser GESTIONNAIRE sur GET /iot/measurements/latest', () => {
        mockReq = { user: { role: 'GESTIONNAIRE' } };
        
        const middleware = requirePermission('iot:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });

      it('devrait autoriser ADMIN sur GET /iot/measurements', () => {
        mockReq = { user: { role: 'ADMIN' } };
        
        const middleware = requirePermission('iot:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('Capteurs Endpoints', () => {
      it('devrait autoriser CITOYEN sur GET /iot/sensors', () => {
        mockReq = { user: { role: 'CITOYEN' } };
        
        const middleware = requirePermission('iot:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });

      it('devrait autoriser GESTIONNAIRE sur GET /iot/sensors/:id', () => {
        mockReq = { user: { role: 'GESTIONNAIRE' } };
        
        const middleware = requirePermission('iot:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('Alertes Endpoints - Lecture', () => {
      it('devrait autoriser CITOYEN sur GET /iot/alerts', () => {
        mockReq = { user: { role: 'CITOYEN' } };
        
        const middleware = requirePermission('iot:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });

      it('devrait autoriser AGENT sur GET /iot/alerts', () => {
        mockReq = { user: { role: 'AGENT' } };
        
        const middleware = requirePermission('iot:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });

      it('devrait autoriser GESTIONNAIRE sur GET /iot/alerts', () => {
        mockReq = { user: { role: 'GESTIONNAIRE' } };
        
        const middleware = requirePermission('iot:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('Alertes Endpoints - Modification', () => {
      it('devrait autoriser AGENT sur PATCH /iot/alerts/:id (iot:update)', () => {
        mockReq = { user: { role: 'AGENT' } };
        
        const middleware = requirePermission('iot:update');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });

      it('devrait autoriser GESTIONNAIRE sur PATCH /iot/alerts/:id (iot:update)', () => {
        mockReq = { user: { role: 'GESTIONNAIRE' } };
        
        const middleware = requirePermission('iot:update');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });

      it('ne devrait pas autoriser CITOYEN sur PATCH /iot/alerts/:id (iot:update)', () => {
        mockReq = { user: { role: 'CITOYEN' } };
        
        const middleware = requirePermission('iot:update');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({
          error: 'Insufficient permissions',
          required: 'iot:update',
          role: 'CITOYEN'
        });
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('Stats Endpoints', () => {
      it('devrait autoriser CITOYEN sur GET /iot/stats', () => {
        mockReq = { user: { role: 'CITOYEN' } };
        
        const middleware = requirePermission('iot:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });

      it('devrait autoriser ADMIN sur GET /iot/stats', () => {
        mockReq = { user: { role: 'ADMIN' } };
        
        const middleware = requirePermission('iot:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });
    });
  });

  describe('Erreurs RBAC', () => {
    it('devrait retourner 401 sans utilisateur', () => {
      mockReq = { user: undefined };
      
      const middleware = requirePermission('iot:read');
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('devrait retourner 403 pour CITOYEN tentant iot:update', () => {
      mockReq = { user: { role: 'CITOYEN' } };
      
      const middleware = requirePermission('iot:update');
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions',
        required: 'iot:update',
        role: 'CITOYEN'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Tableau de bord des permissions IoT', () => {
    const endpointsIoT = [
      { method: 'GET', path: '/iot/measurements', permission: 'iot:read', rolesAutorises: ['CITOYEN', 'AGENT', 'GESTIONNAIRE', 'ADMIN'] },
      { method: 'GET', path: '/iot/measurements/latest', permission: 'iot:read', rolesAutorises: ['CITOYEN', 'AGENT', 'GESTIONNAIRE', 'ADMIN'] },
      { method: 'GET', path: '/iot/measurements/container/:id', permission: 'iot:read', rolesAutorises: ['CITOYEN', 'AGENT', 'GESTIONNAIRE', 'ADMIN'] },
      { method: 'GET', path: '/iot/sensors', permission: 'iot:read', rolesAutorises: ['CITOYEN', 'AGENT', 'GESTIONNAIRE', 'ADMIN'] },
      { method: 'GET', path: '/iot/sensors/:id', permission: 'iot:read', rolesAutorises: ['CITOYEN', 'AGENT', 'GESTIONNAIRE', 'ADMIN'] },
      { method: 'GET', path: '/iot/alerts', permission: 'iot:read', rolesAutorises: ['CITOYEN', 'AGENT', 'GESTIONNAIRE', 'ADMIN'] },
      { method: 'PATCH', path: '/iot/alerts/:id', permission: 'iot:update', rolesAutorises: ['AGENT', 'GESTIONNAIRE', 'ADMIN'] },
      { method: 'GET', path: '/iot/stats', permission: 'iot:read', rolesAutorises: ['CITOYEN', 'AGENT', 'GESTIONNAIRE', 'ADMIN'] },
    ];

    const tousLesRoles = ['CITOYEN', 'AGENT', 'GESTIONNAIRE', 'ADMIN'];

    endpointsIoT.forEach(({ method, path, permission, rolesAutorises }) => {
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
