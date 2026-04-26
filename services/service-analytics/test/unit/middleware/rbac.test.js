/**
 * Tests Unitaires - RBAC Middleware Analytics
 * Tests des permissions RBAC pour service-analytics
 */

const { requirePermission, requirePermissions, hasPermission } = require('../../../src/middleware/rbac');

describe('RBAC Middleware - Service Analytics', () => {
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

  describe('hasPermission - Analytics', () => {
    describe('CITOYEN', () => {
      it('devrait avoir analytics:read', () => {
        expect(hasPermission('CITOYEN', 'analytics:read')).toBe(true);
      });

      it('ne devrait pas avoir analytics:create', () => {
        expect(hasPermission('CITOYEN', 'analytics:create')).toBe(false);
      });

      it('ne devrait pas avoir analytics:update', () => {
        expect(hasPermission('CITOYEN', 'analytics:update')).toBe(false);
      });

      it('ne devrait pas avoir analytics:delete', () => {
        expect(hasPermission('CITOYEN', 'analytics:delete')).toBe(false);
      });
    });

    describe('AGENT', () => {
      it('devrait avoir analytics:read', () => {
        expect(hasPermission('AGENT', 'analytics:read')).toBe(true);
      });

      it('ne devrait pas avoir analytics:create', () => {
        expect(hasPermission('AGENT', 'analytics:create')).toBe(false);
      });
    });

    describe('GESTIONNAIRE', () => {
      it('devrait avoir analytics:read', () => {
        expect(hasPermission('GESTIONNAIRE', 'analytics:read')).toBe(true);
      });

      it('ne devrait pas avoir analytics:create', () => {
        expect(hasPermission('GESTIONNAIRE', 'analytics:create')).toBe(false);
      });
    });

    describe('ADMIN', () => {
      it('devrait avoir analytics:read (wildcard)', () => {
        expect(hasPermission('ADMIN', 'analytics:read')).toBe(true);
      });

      it('devrait avoir analytics:n\'importe quoi (wildcard)', () => {
        expect(hasPermission('ADMIN', 'analytics:anything')).toBe(true);
      });
    });
  });

  describe('requirePermission - Endpoints Analytics', () => {
    describe('Dashboard Endpoints', () => {
      it('devrait autoriser CITOYEN sur GET /dashboard', () => {
        mockReq = { user: { role: 'CITOYEN' } };
        
        const middleware = requirePermission('analytics:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });

      it('devrait autoriser AGENT sur GET /dashboard', () => {
        mockReq = { user: { role: 'AGENT' } };
        
        const middleware = requirePermission('analytics:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });

      it('devrait autoriser GESTIONNAIRE sur GET /dashboard', () => {
        mockReq = { user: { role: 'GESTIONNAIRE' } };
        
        const middleware = requirePermission('analytics:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });

      it('devrait autoriser ADMIN sur GET /dashboard', () => {
        mockReq = { user: { role: 'ADMIN' } };
        
        const middleware = requirePermission('analytics:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('Aggregation Endpoints', () => {
      it('devrait autoriser CITOYEN sur GET /aggregations', () => {
        mockReq = { user: { role: 'CITOYEN' } };
        
        const middleware = requirePermission('analytics:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('Report Endpoints', () => {
      it('devrait autoriser GESTIONNAIRE sur POST /reports/generate', () => {
        mockReq = { user: { role: 'GESTIONNAIRE' } };
        
        const middleware = requirePermission('analytics:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });

      it('devrait autoriser ADMIN sur POST /reports/generate', () => {
        mockReq = { user: { role: 'ADMIN' } };
        
        const middleware = requirePermission('analytics:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('Performance Endpoints', () => {
      it('devrait autoriser CITOYEN sur GET /performance/dashboard', () => {
        mockReq = { user: { role: 'CITOYEN' } };
        
        const middleware = requirePermission('analytics:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });

      it('devrait autoriser AGENT sur GET /performance/agents/ranking', () => {
        mockReq = { user: { role: 'AGENT' } };
        
        const middleware = requirePermission('analytics:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('ML Endpoints', () => {
      it('devrait autoriser GESTIONNAIRE sur POST /ml/predict', () => {
        mockReq = { user: { role: 'GESTIONNAIRE' } };
        
        const middleware = requirePermission('analytics:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });

      it('devrait autoriser ADMIN sur GET /ml/anomalies', () => {
        mockReq = { user: { role: 'ADMIN' } };
        
        const middleware = requirePermission('analytics:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('Metrics Endpoints', () => {
      it('devrait autoriser CITOYEN sur GET /metrics/overview', () => {
        mockReq = { user: { role: 'CITOYEN' } };
        
        const middleware = requirePermission('analytics:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });

      it('devrait autoriser AGENT sur GET /metrics/services', () => {
        mockReq = { user: { role: 'AGENT' } };
        
        const middleware = requirePermission('analytics:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });

      it('devrait autoriser GESTIONNAIRE sur GET /metrics/alerts', () => {
        mockReq = { user: { role: 'GESTIONNAIRE' } };
        
        const middleware = requirePermission('analytics:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });

      it('devrait autoriser ADMIN sur GET /metrics/database', () => {
        mockReq = { user: { role: 'ADMIN' } };
        
        const middleware = requirePermission('analytics:read');
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalled();
      });
    });
  });

  describe('Erreurs RBAC', () => {
    it('devrait retourner 401 sans utilisateur', () => {
      mockReq = { user: undefined };
      
      const middleware = requirePermission('analytics:read');
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('devrait retourner 403 avec rôle sans permission', () => {
      mockReq = { user: { role: 'CITOYEN' } };
      
      const middleware = requirePermission('analytics:create');
      middleware(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions',
        required: 'analytics:create',
        role: 'CITOYEN'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Tableau de bord des permissions Analytics', () => {
    const endpointsAnalytics = [
      { method: 'GET', path: '/dashboard', permission: 'analytics:read' },
      { method: 'GET', path: '/aggregations', permission: 'analytics:read' },
      { method: 'POST', path: '/reports/generate', permission: 'analytics:read' },
      { method: 'GET', path: '/reports/download/:filename', permission: 'analytics:read' },
      { method: 'POST', path: '/reports/environmental', permission: 'analytics:read' },
      { method: 'POST', path: '/reports/routes-performance', permission: 'analytics:read' },
      { method: 'GET', path: '/performance/dashboard', permission: 'analytics:read' },
      { method: 'GET', path: '/performance/agents/ranking', permission: 'analytics:read' },
      { method: 'GET', path: '/performance/agents/:id', permission: 'analytics:read' },
      { method: 'GET', path: '/performance/environmental', permission: 'analytics:read' },
      { method: 'GET', path: '/performance/environmental/evolution', permission: 'analytics:read' },
      { method: 'GET', path: '/performance/environmental/zones', permission: 'analytics:read' },
      { method: 'POST', path: '/ml/predict', permission: 'analytics:read' },
      { method: 'GET', path: '/ml/predict-critical', permission: 'analytics:read' },
      { method: 'GET', path: '/ml/anomalies/:containerId', permission: 'analytics:read' },
      { method: 'GET', path: '/ml/defective-sensors', permission: 'analytics:read' },
      { method: 'POST', path: '/ml/anomalies/:containerId/alerts', permission: 'analytics:read' },
      { method: 'GET', path: '/metrics/overview', permission: 'analytics:read' },
      { method: 'GET', path: '/metrics/services', permission: 'analytics:read' },
      { method: 'GET', path: '/metrics/iot', permission: 'analytics:read' },
      { method: 'GET', path: '/metrics/kafka', permission: 'analytics:read' },
      { method: 'GET', path: '/metrics/database', permission: 'analytics:read' },
      { method: 'GET', path: '/metrics/alerts', permission: 'analytics:read' },
      { method: 'GET', path: '/metrics/alerts/counts', permission: 'analytics:read' },
      { method: 'GET', path: '/metrics/history', permission: 'analytics:read' },
    ];

    const rolesWithAccess = ['CITOYEN', 'AGENT', 'GESTIONNAIRE', 'ADMIN'];

    endpointsAnalytics.forEach(({ method, path, permission }) => {
      rolesWithAccess.forEach(role => {
        it(`devrait autoriser ${role} sur ${method} ${path}`, () => {
          mockReq = { user: { role } };
          
          const middleware = requirePermission(permission);
          middleware(mockReq, mockRes, mockNext);
          
          expect(mockNext).toHaveBeenCalled();
        });
      });
    });
  });
});
