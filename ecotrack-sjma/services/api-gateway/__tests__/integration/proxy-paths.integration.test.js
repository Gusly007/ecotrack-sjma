import http from 'node:http';
import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// Vérifie le chemin réellement transmis aux services par le proxy du gateway (SCRUM-29).
// Un faux service renvoie l'URL qu'il reçoit ; tous les services pointent vers lui.

process.env.DISABLE_AUTO_START = 'true';
process.env.NODE_ENV = 'test';
process.env.GATEWAY_RATE_BYPASS_LOCAL = 'true';

let upstream;
let server;
let baseUrl;

beforeAll(async () => {
  upstream = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ path: req.url }));
  });
  await new Promise((resolve) => upstream.listen(0, '127.0.0.1', resolve));
  const upstreamUrl = `http://127.0.0.1:${upstream.address().port}`;

  // Lues au chargement de src/index.js : à définir avant l'import.
  process.env.USERS_SERVICE_URL = upstreamUrl;
  process.env.GAMIFICATIONS_SERVICE_URL = upstreamUrl;
  process.env.IOT_SERVICE_URL = upstreamUrl;
  process.env.NOTIFICATION_SERVICE_URL = upstreamUrl;

  await jest.unstable_mockModule('../../src/services/healthCheck.js', () => ({
    default: {
      registerService: jest.fn(),
      close: jest.fn(),
      getOverallStatus: jest.fn(),
      checkService: jest.fn(),
      checkAllServices: jest.fn(),
      getServiceStatus: jest.fn(),
      getAllServices: jest.fn(),
      isUrlAllowed: jest.fn().mockReturnValue(true)
    }
  }));

  await jest.unstable_mockModule('../../src/services/centralizedLogging.js', () => ({
    default: {
      connect: jest.fn().mockResolvedValue(),
      close: jest.fn().mockResolvedValue(),
      log: jest.fn().mockResolvedValue()
    }
  }));

  await jest.unstable_mockModule('../../src/services/dashboardStats.js', () => ({
    default: { close: jest.fn().mockResolvedValue() }
  }));

  await jest.unstable_mockModule('../../src/services/cacheService.js', () => ({
    default: { connect: jest.fn().mockResolvedValue(), close: jest.fn().mockResolvedValue() }
  }));

  const passthroughMiddleware = (req, res, next) => next();
  await jest.unstable_mockModule('../../src/middleware/auth.js', () => ({
    default: passthroughMiddleware,
    jwtValidationMiddleware: passthroughMiddleware,
    requireRole: (..._roles) => passthroughMiddleware
  }));

  const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
  await jest.unstable_mockModule('../../src/middleware/logger.js', () => ({
    default: mockLogger,
    logger: mockLogger,
    requestLogger: (req, res, next) => next(),
    detailedRequestLogger: (req, res, next) => next(),
    errorLogger: (err, req, res, next) => next(err),
    securityLogger: jest.fn()
  }));

  await jest.unstable_mockModule('../../src/swagger-config.js', () => ({
    unifiedSwaggerSpec: { openapi: '3.0.0', info: { title: 'EcoTrack Gateway', version: '1.0.0' }, paths: {} },
    swaggerOptions: {}
  }));

  const { default: app } = await import('../../src/index.js');
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
  await new Promise((resolve) => upstream.close(resolve));
});

describe('api-gateway proxy : chemin transmis aux services', () => {
  it.each([
    // service-users
    ['/api/V1/users/profile-with-stats', '/users/profile-with-stats'],
    ['/api/V1/users/me', '/users/me'],
    // service-gamifications
    ['/api/V1/gamification/defis?statut=ACTIF', '/defis/?statut=ACTIF'],
    ['/api/V1/gamification/badges', '/badges/'],
    ['/api/V1/gamification/badges/utilisateurs/5', '/badges/utilisateurs/5'],
    ['/api/V1/gamification/classement?limit=10', '/classement/?limit=10'],
    ['/api/V1/gamification/actions', '/actions/'],
    ['/api/V1/gamification/notifications', '/notifications/'],
    ['/api/V1/gamification/stats/utilisateurs/5/stats', '/utilisateurs/5/stats'],
    ['/api/V1/gamification/stats/utilisateurs/5/historique?limit=20', '/utilisateurs/5/historique?limit=20'],
    // service-iot
    ['/api/V1/iot/alerts', '/api/iot/alerts'],
    // service-notification
    ['/api/V1/notifications/unread-count', '/api/notifications/unread-count'],
    ['/api/V1/admin/notifications/history', '/api/admin/notifications/history']
  ])('%s -> %s', async (gatewayPath, expectedPath) => {
    const response = await fetch(`${baseUrl}${gatewayPath}`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.path).toBe(expectedPath);
  });
});
