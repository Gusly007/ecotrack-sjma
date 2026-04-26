import { jest, describe, it, expect, afterEach, beforeAll } from '@jest/globals';

process.env.DISABLE_AUTO_START = 'true';
process.env.NODE_ENV = 'test';
process.env.GATEWAY_RATE_BYPASS_LOCAL = 'true';

const mockHealthCheckService = {
  registerService: jest.fn(),
  close: jest.fn(),
  getOverallStatus: jest.fn(),
  checkService: jest.fn(),
  checkAllServices: jest.fn(),
  getServiceStatus: jest.fn(),
  getAllServices: jest.fn(),
  isUrlAllowed: jest.fn().mockReturnValue(true)
};

const mockCentralizedLogging = {
  connect: jest.fn().mockResolvedValue(),
  close: jest.fn().mockResolvedValue(),
  log: jest.fn().mockResolvedValue(),
  queryLogs: jest.fn().mockResolvedValue([]),
  getSummary: jest.fn().mockResolvedValue([]),
  getStats: jest.fn().mockResolvedValue({}),
  getFilterValues: jest.fn().mockResolvedValue({}),
  exportLogs: jest.fn().mockResolvedValue([])
};

const mockDashboardStats = {
  close: jest.fn().mockResolvedValue()
};

const mockCacheService = {
  connect: jest.fn().mockResolvedValue(),
  close: jest.fn().mockResolvedValue()
};

let request;
let app;
let server;
let baseUrl;

beforeAll(async () => {
  await jest.unstable_mockModule('../../src/services/healthCheck.js', () => ({
    default: mockHealthCheckService
  }));

  await jest.unstable_mockModule('../../src/services/centralizedLogging.js', () => ({
    default: mockCentralizedLogging
  }));

  await jest.unstable_mockModule('../../src/services/dashboardStats.js', () => ({
    default: mockDashboardStats
  }));

  await jest.unstable_mockModule('../../src/services/cacheService.js', () => ({
    default: mockCacheService
  }));

  await jest.unstable_mockModule('../../src/middleware/auth.js', () => ({
    jwtValidationMiddleware: (req, res, next) => next()
  }));

  await jest.unstable_mockModule('../../src/middleware/logger.js', () => ({
    requestLogger: (req, res, next) => next(),
    detailedRequestLogger: (req, res, next) => next(),
    errorLogger: (err, req, res, next) => next(err),
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    }
  }));

  await jest.unstable_mockModule('../../src/swagger-config.js', () => ({
    unifiedSwaggerSpec: { openapi: '3.0.0', info: { title: 'EcoTrack Gateway', version: '1.0.0' }, paths: {} },
    swaggerOptions: {}
  }));

  ({ default: app } = await import('../../src/index.js'));
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const address = server.address();
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

afterAll(() => new Promise((resolve) => server.close(resolve)));

afterEach(() => {
  jest.clearAllMocks();
});

describe('api-gateway integration', () => {
  it('returns a healthy status on /health', async () => {
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ status: 'ok', gateway: 'up' });
  });

  it('serves the unified api docs page', async () => {
    const response = await fetch(`${baseUrl}/api-docs`);

    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(500);
  });
});
