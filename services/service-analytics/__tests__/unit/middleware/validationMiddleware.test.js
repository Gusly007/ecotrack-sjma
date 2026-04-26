const ValidationMiddleware = require('../../../src/middleware/validationMiddleware');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
}

describe('ValidationMiddleware', () => {
  test('validateDashboardQuery handles valid and invalid periods', () => {
    const res = createRes();
    const next = jest.fn();

    ValidationMiddleware.validateDashboardQuery()({ query: { period: 'week' } }, res, next);
    expect(next).toHaveBeenCalled();

    ValidationMiddleware.validateDashboardQuery()({ query: { period: 'bad' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('validateDateRange supports query and body sources', () => {
    const res = createRes();
    const next = jest.fn();

    ValidationMiddleware.validateDateRange()({ query: { startDate: '2026-01-01', endDate: '2026-01-31' } }, res, next);
    expect(next).toHaveBeenCalled();

    ValidationMiddleware.validateDateRange()({ query: {}, body: { startDate: '2026-01-01', endDate: '2025-01-01' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('validateReportRequest normalizes defaults and rejects invalid format', () => {
    const res = createRes();
    const next = jest.fn();
    const req = { body: {} };

    ValidationMiddleware.validateReportRequest()(req, res, next);
    expect(req.body).toEqual({ format: 'pdf', reportType: 'weekly' });
    expect(next).toHaveBeenCalled();

    ValidationMiddleware.validateReportRequest()({ body: { format: 'txt' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('validatePrediction normalizes legacy payloads and rejects invalid ids', () => {
    const res = createRes();
    const next = jest.fn();
    const req = { body: { id_conteneur: 7, days: 3, includeConfidence: true, extra: 'x' } };

    ValidationMiddleware.validatePrediction()(req, res, next);
    expect(req.body).toEqual({ containerId: 7, daysAhead: 3, includeWeather: true });
    expect(next).toHaveBeenCalled();

    ValidationMiddleware.validatePrediction()({ body: { containerId: 0 } }, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});



