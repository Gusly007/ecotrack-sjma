jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

jest.mock('../../../src/services/predictionService', () => ({
  predictWithWeather: jest.fn(),
  predictFillLevel: jest.fn(),
  predictCriticalContainers: jest.fn()
}));

jest.mock('../../../src/services/anomalyService', () => ({
  detectAnomalies: jest.fn(),
  detectDefectiveSensors: jest.fn(),
  createAlerts: jest.fn()
}));

const PredictionService = require('../../../src/services/predictionService');
const AnomalyService = require('../../../src/services/anomalyService');
const MLController = require('../../../src/controllers/mlController');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
}

describe('MLController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('predictFillLevel validates input and supports weather branch', async () => {
    const res = createRes();

    await MLController.predictFillLevel({ body: {} }, res);
    expect(res.status).toHaveBeenCalledWith(400);

    PredictionService.predictWithWeather.mockResolvedValueOnce({ predicted: true });
    await MLController.predictFillLevel({ body: { containerId: 1, daysAhead: 2, includeWeather: true } }, res);
    expect(PredictionService.predictWithWeather).toHaveBeenCalledWith(1, 2);

    PredictionService.predictFillLevel.mockResolvedValueOnce(null);
    await MLController.predictFillLevel({ body: { containerId: 1, daysAhead: 2 } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('predictCritical paginates predictions', async () => {
    const res = createRes();
    PredictionService.predictCriticalContainers.mockResolvedValueOnce(Array.from({ length: 3 }, (_, index) => ({ id: index + 1 })));

    await MLController.predictCritical({ query: { daysAhead: '2', threshold: '90', page: '1', limit: '2' } }, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        count: 3,
        daysAhead: 2,
        threshold: 90,
        predictions: [{ id: 1 }, { id: 2 }]
      },
      pagination: {
        page: 1,
        limit: 2,
        total: 3,
        pages: 2,
        hasMore: true
      }
    });
  });

  test('detectAnomalies and getDefectiveSensors paginate results', async () => {
    const res = createRes();
    AnomalyService.detectAnomalies.mockResolvedValueOnce([{ id: 1 }, { id: 2 }]);
    await MLController.detectAnomalies({ params: { containerId: 5 }, query: { threshold: '1.5', page: '1', limit: '1' } }, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ pagination: expect.objectContaining({ total: 2, pages: 2 }) }));

    AnomalyService.detectDefectiveSensors.mockResolvedValueOnce([{ id: 9 }]);
    await MLController.getDefectiveSensors({ query: { page: '1', limit: '1' } }, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: [{ id: 9 }] }));
  });

  test('detectAnomaliesAndCreateAlerts creates alerts conditionally', async () => {
    const res = createRes();
    AnomalyService.detectAnomalies.mockResolvedValueOnce({ anomaliesCount: 0 });
    await MLController.detectAnomaliesAndCreateAlerts({ params: { containerId: 3 }, query: { threshold: '2', autoCreate: true } }, res);
    expect(AnomalyService.createAlerts).not.toHaveBeenCalled();

    AnomalyService.detectAnomalies.mockResolvedValueOnce({ anomaliesCount: 12 });
    AnomalyService.createAlerts.mockResolvedValueOnce(undefined);
    await MLController.detectAnomaliesAndCreateAlerts({ params: { containerId: 3 }, query: { threshold: '2', autoCreate: true } }, res);
    expect(AnomalyService.createAlerts).toHaveBeenCalledWith({ anomaliesCount: 12 });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ alertsCreated: 10 }) }));
  });
});



