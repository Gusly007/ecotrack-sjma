jest.mock('express', () => ({
  Router: jest.fn(() => {
    const routerMock = {
      get: jest.fn(),
      post: jest.fn()
    };
    return routerMock;
  })
}));

jest.mock('../../../src/controllers/dashboardController', () => ({
  getDashboard: jest.fn(),
  getRealTimeStats: jest.fn(),
  getHeatmap: jest.fn(),
  getEvolution: jest.fn()
}));

jest.mock('../../../src/middleware/authMiddleware', () => jest.fn((req, res, next) => next()));
jest.mock('../../../src/middleware/validationMiddleware', () => ({
  validateDashboardQuery: jest.fn(() => (req, res, next) => next())
}));
jest.mock('../../../src/middleware/rateLimitMiddleware', () => ({ generalLimiter: jest.fn((req, res, next) => next()) }));
jest.mock('../../../src/middleware/rbac', () => ({ requirePermission: jest.fn(() => (req, res, next) => next()) }));

require('../../../src/routes/dashboardRoutes');
const express = require('express');
const routerMock = express.Router.mock.results[0].value;

describe('dashboardRoutes', () => {
  test('registers expected routes with middleware chains', () => {
    expect(routerMock.get).toHaveBeenCalledTimes(4);
    expect(routerMock.get.mock.calls[0][0]).toBe('/dashboard');
    expect(routerMock.get.mock.calls[1][0]).toBe('/realtime');
    expect(routerMock.get.mock.calls[2][0]).toBe('/heatmap');
    expect(routerMock.get.mock.calls[3][0]).toBe('/evolution');
  });
});



