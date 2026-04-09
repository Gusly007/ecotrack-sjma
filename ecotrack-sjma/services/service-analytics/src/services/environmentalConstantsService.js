const logger = require('../utils/logger');
const CONSTANTS = require('../config/constants');

let constantsCache = new Map();
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60000;

const DEFAULT_ENV_CONSTANTS = {
  CO2_PER_KM: 0.85,
  FUEL_CONSUMPTION_PER_100KM: 35,
  FUEL_PRICE_PER_LITER: 1.65,
  LABOR_COST_PER_HOUR: 50,
  MAINTENANCE_COST_PER_KM: 0.15,
  CO2_PER_TREE_PER_YEAR: 20,
  CO2_PER_KM_CAR: 0.12
};

class EnvironmentalConstantsService {
  static async getEnvironmentalConstants(forceRefresh = false) {
    const now = Date.now();
    
    if (!forceRefresh && constantsCache.size > 0 && (now - cacheTimestamp) < CACHE_TTL_MS) {
      return constantsCache;
    }

    try {
      const url = `${CONSTANTS.SERVICE_URLS.USERS_SERVICE}/admin/environmental-constants/internal`;
      logger.info({ url }, 'Fetching environmental constants from service-users');
      const response = await fetch(url);

      if (!response.ok) {
        logger.error(`Failed to fetch constants: ${response.status}`);
        throw new Error(`Failed to fetch constants: ${response.status}`);
      }

      const data = await response.json();
      const constants = {};

      if (data.CO2_PER_KM) constants.CO2_PER_KM = parseFloat(data.CO2_PER_KM.value) || DEFAULT_ENV_CONSTANTS.CO2_PER_KM;
      if (data.FUEL_CONSUMPTION_PER_100KM) constants.FUEL_CONSUMPTION_PER_100KM = parseFloat(data.FUEL_CONSUMPTION_PER_100KM.value) || DEFAULT_ENV_CONSTANTS.FUEL_CONSUMPTION_PER_100KM;
      if (data.FUEL_PRICE_PER_LITER) constants.FUEL_PRICE_PER_LITER = parseFloat(data.FUEL_PRICE_PER_LITER.value) || DEFAULT_ENV_CONSTANTS.FUEL_PRICE_PER_LITER;
      if (data.LABOR_COST_PER_HOUR) constants.LABOR_COST_PER_HOUR = parseFloat(data.LABOR_COST_PER_HOUR.value) || DEFAULT_ENV_CONSTANTS.LABOR_COST_PER_HOUR;
      if (data.MAINTENANCE_COST_PER_KM) constants.MAINTENANCE_COST_PER_KM = parseFloat(data.MAINTENANCE_COST_PER_KM.value) || DEFAULT_ENV_CONSTANTS.MAINTENANCE_COST_PER_KM;
      if (data.CO2_PER_TREE_PER_YEAR) constants.CO2_PER_TREE_PER_YEAR = parseFloat(data.CO2_PER_TREE_PER_YEAR.value) || DEFAULT_ENV_CONSTANTS.CO2_PER_TREE_PER_YEAR;
      if (data.CO2_PER_KM_CAR) constants.CO2_PER_KM_CAR = parseFloat(data.CO2_PER_KM_CAR.value) || DEFAULT_ENV_CONSTANTS.CO2_PER_KM_CAR;

      constantsCache = new Map(Object.entries(constants));
      cacheTimestamp = now;
      logger.info({ constants: Object.fromEntries(constantsCache) }, 'Environmental constants loaded from service-users');
      
      logger.info('Loaded environmental constants from service-users');
      return constantsCache;
    } catch (error) {
      logger.warn('Failed to fetch environmental constants from service-users, using defaults:', error.message);
      if (constantsCache.size === 0) {
        constantsCache = new Map(Object.entries(DEFAULT_ENV_CONSTANTS));
      }
      return constantsCache;
    }
  }

  static calculateCO2(distanceKm) {
    const constants = constantsCache.size > 0 ? constantsCache : new Map(Object.entries(DEFAULT_ENV_CONSTANTS));
    const co2PerKm = constants.get('CO2_PER_KM') || DEFAULT_ENV_CONSTANTS.CO2_PER_KM;
    return parseFloat((distanceKm * co2PerKm).toFixed(2));
  }

  static calculateFuelConsumption(distanceKm) {
    const constants = constantsCache.size > 0 ? constantsCache : new Map(Object.entries(DEFAULT_ENV_CONSTANTS));
    const fuelPer100km = constants.get('FUEL_CONSUMPTION_PER_100KM') || DEFAULT_ENV_CONSTANTS.FUEL_CONSUMPTION_PER_100KM;
    return parseFloat((distanceKm * fuelPer100km / 100).toFixed(2));
  }

  static calculateFuelCost(distanceKm) {
    const constants = constantsCache.size > 0 ? constantsCache : new Map(Object.entries(DEFAULT_ENV_CONSTANTS));
    const fuelPer100km = constants.get('FUEL_CONSUMPTION_PER_100KM') || DEFAULT_ENV_CONSTANTS.FUEL_CONSUMPTION_PER_100KM;
    const fuelPrice = constants.get('FUEL_PRICE_PER_LITER') || DEFAULT_ENV_CONSTANTS.FUEL_PRICE_PER_LITER;
    const liters = distanceKm * fuelPer100km / 100;
    return parseFloat((liters * fuelPrice).toFixed(2));
  }

  static calculateLaborCost(durationMin) {
    const constants = constantsCache.size > 0 ? constantsCache : new Map(Object.entries(DEFAULT_ENV_CONSTANTS));
    const laborCost = constants.get('LABOR_COST_PER_HOUR') || DEFAULT_ENV_CONSTANTS.LABOR_COST_PER_HOUR;
    const hours = durationMin / 60;
    return parseFloat((hours * laborCost).toFixed(2));
  }

  static calculateMaintenanceCost(distanceKm) {
    const constants = constantsCache.size > 0 ? constantsCache : new Map(Object.entries(DEFAULT_ENV_CONSTANTS));
    const maintenanceCost = constants.get('MAINTENANCE_COST_PER_KM') || DEFAULT_ENV_CONSTANTS.MAINTENANCE_COST_PER_KM;
    return parseFloat((distanceKm * maintenanceCost).toFixed(2));
  }

  static calculateTotalCostSaved(distanceSaved, durationSaved) {
    const fuelCost = this.calculateFuelCost(distanceSaved);
    const laborCost = this.calculateLaborCost(Math.abs(durationSaved));
    const maintenanceCost = this.calculateMaintenanceCost(distanceSaved);
    return parseFloat((fuelCost + laborCost + maintenanceCost).toFixed(2));
  }

  static calculateCO2Equivalents(co2Kg) {
    const constants = constantsCache.size > 0 ? constantsCache : new Map(Object.entries(DEFAULT_ENV_CONSTANTS));
    const co2PerTree = constants.get('CO2_PER_TREE_PER_YEAR') || DEFAULT_ENV_CONSTANTS.CO2_PER_TREE_PER_YEAR;
    const co2PerCar = constants.get('CO2_PER_KM_CAR') || DEFAULT_ENV_CONSTANTS.CO2_PER_KM_CAR;
    return {
      trees: Math.round(co2Kg / co2PerTree),
      carKm: Math.round(co2Kg / co2PerCar)
    };
  }

  static async clearCache() {
    constantsCache = new Map();
    cacheTimestamp = 0;
    logger.info('Environmental constants cache cleared');
  }
}

module.exports = EnvironmentalConstantsService;
