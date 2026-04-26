import { loadEnvironmentalConstants, getEnvironmentalConstant } from '../repositories/environmentalConstants.repository.js';

let defaultConstants = {
    CO2_PER_KM: 0.85,
    FUEL_CONSUMPTION_PER_100KM: 35,
    FUEL_PRICE_PER_LITER: 1.65,
    LABOR_COST_PER_HOUR: 50,
    MAINTENANCE_COST_PER_KM: 0.15,
    CO2_PER_TREE_PER_YEAR: 20,
    CO2_PER_KM_CAR: 0.12
};

export const ENVIRONMENTAL_CONSTANTS = {
    get CO2_PER_KM() { return defaultConstants.CO2_PER_KM; },
    get FUEL_CONSUMPTION_PER_100KM() { return defaultConstants.FUEL_CONSUMPTION_PER_100KM; },
    get FUEL_PRICE_PER_LITER() { return defaultConstants.FUEL_PRICE_PER_LITER; },
    get LABOR_COST_PER_HOUR() { return defaultConstants.LABOR_COST_PER_HOUR; },
    get MAINTENANCE_COST_PER_KM() { return defaultConstants.MAINTENANCE_COST_PER_KM; },
    get CO2_PER_TREE_PER_YEAR() { return defaultConstants.CO2_PER_TREE_PER_YEAR; },
    get CO2_PER_KM_CAR() { return defaultConstants.CO2_PER_KM_CAR; }
};

export const loadFromDatabase = async () => {
    try {
        const constants = await loadEnvironmentalConstants();
        if (constants.size > 0) {
            defaultConstants = Object.fromEntries(constants);
        }
    } catch (err) {
        console.error('Failed to load environmental constants from DB, using defaults:', err);
    }
};

export const getConstant = async (key) => {
    const value = await getEnvironmentalConstant(key);
    return value ?? defaultConstants[key] ?? null;
};

export const calculateCO2Emissions = (distanceKm) => {
    return distanceKm * ENVIRONMENTAL_CONSTANTS.CO2_PER_KM;
};

export const calculateFuelCost = (distanceKm) => {
    const fuelConsumed = (distanceKm * ENVIRONMENTAL_CONSTANTS.FUEL_CONSUMPTION_PER_100KM) / 100;
    return fuelConsumed * ENVIRONMENTAL_CONSTANTS.FUEL_PRICE_PER_LITER;
};

export const calculateLaborCost = (hours) => {
    return hours * ENVIRONMENTAL_CONSTANTS.LABOR_COST_PER_HOUR;
};

export const calculateMaintenanceCost = (distanceKm) => {
    return distanceKm * ENVIRONMENTAL_CONSTANTS.MAINTENANCE_COST_PER_KM;
};

export const calculateTotalCost = (distanceKm, laborHours) => {
    return (
        calculateFuelCost(distanceKm) +
        calculateLaborCost(laborHours) +
        calculateMaintenanceCost(distanceKm)
    );
};

export const calculateTreesEquivalent = (co2Kg) => {
    return co2Kg / ENVIRONMENTAL_CONSTANTS.CO2_PER_TREE_PER_YEAR;
};

export const calculateCarEquivalent = (distanceKm) => {
    const carCO2 = distanceKm * ENVIRONMENTAL_CONSTANTS.CO2_PER_KM_CAR;
    return {
        carCO2,
        ecotrackCO2: calculateCO2Emissions(distanceKm),
        savedCO2: carCO2 - calculateCO2Emissions(distanceKm)
    };
};

export default ENVIRONMENTAL_CONSTANTS;
