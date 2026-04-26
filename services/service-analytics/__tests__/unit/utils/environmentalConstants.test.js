const ENVIRONMENTAL_CONSTANTS = require('../../../src/utils/environmentalConstants');

describe('ENVIRONMENTAL_CONSTANTS', () => {
  test('calculates environmental metrics and equivalences', () => {
    expect(ENVIRONMENTAL_CONSTANTS.calculateCO2(10)).toBe(8.5);
    expect(ENVIRONMENTAL_CONSTANTS.calculateFuelConsumption(10)).toBe(3.5);
    expect(ENVIRONMENTAL_CONSTANTS.calculateFuelCost(10)).toBe(5.77);
    expect(ENVIRONMENTAL_CONSTANTS.calculateLaborCost(120)).toBe(100);
    expect(ENVIRONMENTAL_CONSTANTS.calculateMaintenanceCost(10)).toBe(1.5);
    expect(ENVIRONMENTAL_CONSTANTS.calculateTotalCostSaved(10, -120)).toBe(107.27);
    expect(ENVIRONMENTAL_CONSTANTS.calculateCO2Equivalents(40)).toEqual({ trees: 2, carKm: 333 });
  });
});



