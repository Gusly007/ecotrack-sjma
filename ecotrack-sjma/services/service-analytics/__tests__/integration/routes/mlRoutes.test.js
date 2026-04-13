jest.mock('express', () => ({
  Router: jest.fn(() => {
    const routerMock = {
      get: jest.fn(),
      post: jest.fn()
    };
    return routerMock;
  })
}));

jest.mock('../../../src/services/predictionService', () => ({
  predictWithWeather: jest.fn(),
  predictFillLevel: jest.fn(),
  predictCriticalContainers: jest.fn()
}));

jest.mock('../../../src/services/anomalyService', () => ({
  detectAnomalies: jest.fn(),
  detectDefectiveSensors: jest.fn(),
  detectGlobalAnomalies: jest.fn(),
  createAlerts: jest.fn()
}));

jest.mock('../../../src/middleware/rbac', () => ({ requirePermission: jest.fn(() => (req, res, next) => next()) }));
jest.mock('../../../src/middleware/validationMiddleware', () => ({ validatePrediction: jest.fn(() => (req, res, next) => next()) }));
jest.mock('../../../src/middleware/rateLimitMiddleware', () => ({ mlLimiter: jest.fn((req, res, next) => next()) }));

require('../../../src/routes/mlRoutes');
const express = require('express');
const routerMock = express.Router.mock.results[0].value;

describe('mlRoutes', () => {
  test('registers all ml routes', () => {
    expect(routerMock.post).toHaveBeenCalledTimes(2);
    expect(routerMock.get).toHaveBeenCalledTimes(4);
    expect(routerMock.post.mock.calls[0][0]).toBe('/ml/predict');
    expect(routerMock.get.mock.calls[0][0]).toBe('/ml/predict-critical');
    expect(routerMock.get.mock.calls[1][0]).toBe('/ml/anomalies/:containerId');
    expect(routerMock.get.mock.calls[2][0]).toBe('/ml/defective-sensors');
    expect(routerMock.get.mock.calls[3][0]).toBe('/ml/anomalies/global');
  });
});



