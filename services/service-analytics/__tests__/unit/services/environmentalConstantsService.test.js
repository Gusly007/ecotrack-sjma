jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

jest.mock('../../../src/config/constants', () => ({
  SERVICE_URLS: {
    USERS_SERVICE: 'http://users.local'
  }
}));

const logger = require('../../../src/utils/logger');
const service = require('../../../src/services/environmentalConstantsService');

describe('EnvironmentalConstantsService', () => {
  beforeEach(async () => {
    await service.clearCache();
    jest.clearAllMocks();
    global.fetch = undefined;
  });

  test('loads constants from remote service and caches them', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        CO2_PER_KM: { value: '1.1' },
        FUEL_CONSUMPTION_PER_100KM: { value: '40' },
        FUEL_PRICE_PER_LITER: { value: '2' },
        LABOR_COST_PER_HOUR: { value: '60' },
        MAINTENANCE_COST_PER_KM: { value: '0.2' },
        CO2_PER_TREE_PER_YEAR: { value: '25' },
        CO2_PER_KM_CAR: { value: '0.2' }
      })
    });

    const constants = await service.getEnvironmentalConstants(true);
    expect(constants.get('CO2_PER_KM')).toBe(1.1);
    expect(constants.get('FUEL_PRICE_PER_LITER')).toBe(2);
    expect(logger.info).toHaveBeenCalledWith(
      { url: 'http://users.local/admin/environmental-constants/internal' },
      'Fetching environmental constants from service-users'
    );
    expect(global.fetch).toHaveBeenCalledTimes(1);

    const cached = await service.getEnvironmentalConstants();
    expect(cached).toBe(constants);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('falls back to defaults when fetch fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));

    const constants = await service.getEnvironmentalConstants(true);
    expect(constants.get('CO2_PER_KM')).toBe(0.85);
    expect(logger.warn).toHaveBeenCalled();
  });

  test('falls back when response is not ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 });

    await expect(service.getEnvironmentalConstants(true)).resolves.toBeInstanceOf(Map);
    expect(logger.error).toHaveBeenCalledWith('Failed to fetch constants: 503');
  });

  test('calculates derived values using cache or defaults and clears cache', async () => {
    await service.clearCache();

    expect(service.calculateCO2(10)).toBe(8.5);
    expect(service.calculateFuelConsumption(10)).toBe(3.5);
    expect(service.calculateFuelCost(10)).toBe(5.77);
    expect(service.calculateLaborCost(120)).toBe(100);
    expect(service.calculateMaintenanceCost(10)).toBe(1.5);
    expect(service.calculateTotalCostSaved(10, -120)).toBe(107.27);
    expect(service.calculateCO2Equivalents(40)).toEqual({ trees: 2, carKm: 333 });

    await expect(service.clearCache()).resolves.toBeUndefined();
    expect(logger.info).toHaveBeenCalledWith('Environmental constants cache cleared');
  });
});



