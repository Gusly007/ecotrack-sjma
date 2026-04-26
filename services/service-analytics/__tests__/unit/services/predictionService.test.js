jest.mock('../../../src/repositories/predictionRepository', () => ({
  getHistoricalData: jest.fn(),
  savePrediction: jest.fn()
}));

jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

jest.mock('../../../src/config/database', () => ({
  query: jest.fn()
}));

jest.mock('node-fetch', () => jest.fn());

const PredictionRepository = require('../../../src/repositories/predictionRepository');
const logger = require('../../../src/utils/logger');
const db = require('../../../src/config/database');
const fetch = require('node-fetch');
const PredictionService = require('../../../src/services/predictionService');

describe('PredictionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('predictFillLevel returns null when there is not enough data', async () => {
    PredictionRepository.getHistoricalData.mockResolvedValueOnce(Array.from({ length: 9 }, (_, index) => ({
      timestamp: index + 1,
      fill_level: 20 + index
    })));

    await expect(PredictionService.predictFillLevel(11, 2)).resolves.toBeNull();
    expect(logger.warn).toHaveBeenCalledWith('Not enough data for prediction (container 11)');
  });

  test('predictFillLevel uses fallback when timestamps have no variance and saves successful predictions', async () => {
    const flatData = Array.from({ length: 10 }, (_, index) => ({
      timestamp: 1000,
      fill_level: 40 + index
    }));
    PredictionRepository.getHistoricalData.mockResolvedValueOnce(flatData);

    await expect(PredictionService.predictFillLevel(5, 3)).resolves.toEqual(
      expect.objectContaining({
        containerId: 5,
        currentFillLevel: 49,
        predictedFillLevel: 44.5,
        daysAhead: 3,
        confidence: 50,
        modelVersion: '1.0-linear-fallback'
      })
    );
    expect(logger.warn).toHaveBeenCalledWith('Insufficient variance in data for prediction (container 5)');

    PredictionRepository.getHistoricalData.mockResolvedValueOnce(Array.from({ length: 10 }, (_, index) => ({
      timestamp: 1000 + index * 86400,
      fill_level: 10 + index * 4
    })));
    PredictionRepository.savePrediction.mockResolvedValueOnce(undefined);

    const result = await PredictionService.predictFillLevel(7, 1);
    expect(result).toEqual(expect.objectContaining({ containerId: 7, modelVersion: '1.0-linear' }));
    expect(PredictionRepository.savePrediction).toHaveBeenCalledWith(expect.objectContaining({
      containerId: 7,
      predictedFillLevel: expect.any(Number),
      predictionDate: expect.any(String),
      confidence: expect.any(Number),
      modelVersion: '1.0-linear'
    }));

    PredictionRepository.getHistoricalData.mockResolvedValueOnce(Array.from({ length: 10 }, (_, index) => ({
      timestamp: 2000 + index * 86400,
      fill_level: 20 + index * 2
    })));
    PredictionRepository.savePrediction.mockRejectedValueOnce(new Error('save failed'));
    await expect(PredictionService.predictFillLevel(8, 1)).resolves.toEqual(expect.objectContaining({ containerId: 8 }));
    expect(logger.warn).toHaveBeenCalledWith('Could not save prediction, continuing without save');
  });

  test('predictCriticalContainers filters and sorts results and handles errors', async () => {
    db.query.mockResolvedValueOnce({
      rows: [
        { id_conteneur: 1, uid: 'C1', id_zone: 1 },
        { id_conteneur: 2, uid: 'C2', id_zone: 2 },
        { id_conteneur: 3, uid: 'C3', id_zone: 3 }
      ]
    });
    jest.spyOn(PredictionService, 'predictFillLevel')
      .mockResolvedValueOnce({ containerId: 1, predictedFillLevel: 80 })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ containerId: 3, predictedFillLevel: 95 });

    await expect(PredictionService.predictCriticalContainers(2, 75)).resolves.toEqual([
      expect.objectContaining({ uid: 'C3', predictedFillLevel: 95 }),
      expect.objectContaining({ uid: 'C1', predictedFillLevel: 80 })
    ]);
    expect(logger.info).toHaveBeenCalledWith('Predicting for 3 containers...');
    expect(logger.info).toHaveBeenCalledWith('Found 2 critical predictions');

    db.query.mockRejectedValueOnce(new Error('db down'));
    await expect(PredictionService.predictCriticalContainers()).rejects.toThrow('db down');
    expect(logger.error).toHaveBeenCalledWith('Error in predictCriticalContainers:', expect.any(Error));

    PredictionService.predictFillLevel.mockRestore?.();
  });

  test('predictWithWeather applies weather impact and falls back to neutral weather', async () => {
    jest.spyOn(PredictionService, 'predictFillLevel').mockResolvedValueOnce({
      containerId: 12,
      predictedFillLevel: 60,
      currentFillLevel: 50
    });
    jest.spyOn(PredictionService, '_simulateWeatherImpact').mockResolvedValueOnce(0.95);

    await expect(PredictionService.predictWithWeather(12, 2)).resolves.toEqual(
      expect.objectContaining({
        weatherAdjusted: true,
        weatherImpact: -5,
        predictedFillLevel: 57
      })
    );

    PredictionService.predictFillLevel.mockResolvedValueOnce(null);
    await expect(PredictionService.predictWithWeather(12, 2)).resolves.toBeNull();

    PredictionService._simulateWeatherImpact.mockRestore?.();
    PredictionService.predictFillLevel.mockRestore?.();
    fetch.mockResolvedValueOnce({ json: jest.fn().mockResolvedValue({ current_weather: { weathercode: 0 } }) });
    await expect(PredictionService._simulateWeatherImpact()).resolves.toBe(1.1);
  });
});


