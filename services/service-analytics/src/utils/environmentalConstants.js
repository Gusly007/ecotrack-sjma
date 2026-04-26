/**
 * Constantes pour calculs environnementaux - ECOTRACK
 */
const ENVIRONMENTAL_CONSTANTS = {
  // Émissions CO2 en kg par km (camion benne à ordures)
  CO2_PER_KM: 0.85,
  
  // Consommation carburant en litres par 100km
  FUEL_CONSUMPTION_PER_100KM: 35,
  
  // Prix du carburant en € par litre
  FUEL_PRICE_PER_LITER: 1.65,
  
  // Coût main d'œuvre en € par heure
  LABOR_COST_PER_HOUR: 50,
  
  // Coût maintenance par km
  MAINTENANCE_COST_PER_KM: 0.15,
  
  // Équivalence arbres plantés (1 arbre absorbe ~20kg CO2/an)
  CO2_PER_TREE_PER_YEAR: 20,
  
  // Équivalence voiture (voiture moyenne = 120g CO2/km)
  CO2_PER_KM_CAR: 0.12
};

/**
 * Méthodes de calcul
 */
ENVIRONMENTAL_CONSTANTS.calculateCO2 = function(distanceKm) {
  return parseFloat((distanceKm * this.CO2_PER_KM).toFixed(2));
};

ENVIRONMENTAL_CONSTANTS.calculateFuelConsumption = function(distanceKm) {
  return parseFloat((distanceKm * this.FUEL_CONSUMPTION_PER_100KM / 100).toFixed(2));
};

ENVIRONMENTAL_CONSTANTS.calculateFuelCost = function(distanceKm) {
  const liters = this.calculateFuelConsumption(distanceKm);
  return parseFloat((liters * this.FUEL_PRICE_PER_LITER).toFixed(2));
};

ENVIRONMENTAL_CONSTANTS.calculateLaborCost = function(durationMin) {
  const hours = durationMin / 60;
  return parseFloat((hours * this.LABOR_COST_PER_HOUR).toFixed(2));
};

ENVIRONMENTAL_CONSTANTS.calculateMaintenanceCost = function(distanceKm) {
  return parseFloat((distanceKm * this.MAINTENANCE_COST_PER_KM).toFixed(2));
};

ENVIRONMENTAL_CONSTANTS.calculateTotalCostSaved = function(distanceSaved, durationSaved) {
  const fuelCost = this.calculateFuelCost(distanceSaved);
  const laborCost = this.calculateLaborCost(Math.abs(durationSaved));
  const maintenanceCost = this.calculateMaintenanceCost(distanceSaved);
  return parseFloat((fuelCost + laborCost + maintenanceCost).toFixed(2));
};

ENVIRONMENTAL_CONSTANTS.calculateCO2Equivalents = function(co2Kg) {
  return {
    trees: Math.round(co2Kg / this.CO2_PER_TREE_PER_YEAR),
    carKm: Math.round(co2Kg / this.CO2_PER_KM_CAR)
  };
};

module.exports = ENVIRONMENTAL_CONSTANTS;
