/**
 * CONSTANTES ENVIRONNEMENTALES - ECOTRACK
 * 
 * Facteurs de conversion et coefficients pour les calculs d'impact environnemental
 */

const ENVIRONMENTAL_CONSTANTS = {
  // ========== Émissions CO2 ==========
  CO2: {
    // Kg CO2 par litre de carburant
    PER_LITER_DIESEL: 2.68,
    PER_LITER_GASOLINE: 2.31,
    
    // Kg CO2 par km (camion benne)
    PER_KM_DIESEL: 0.21,
    PER_KM_GASOLINE: 0.18,
    
    // Moyenne utilisée pour les calculs
    DEFAULT_PER_LITER: 2.68,
    DEFAULT_PER_KM: 0.21
  },

  // ========== Équivalences CO2 ==========
  EQUIVALENTS: {
    // Kg CO2 absorbé par arbre/an
    PER_TREE_YEAR: 21.77,
    
    // Kg CO2 par km en voiture (moyenne)
    PER_CAR_KM: 0.12,
    
    // Kg CO2 par kWh électricité
    PER_KWH: 0.05
  },

  // ========== Carburant ==========
  FUEL: {
    // Consommation moyenne benne à ordures (L/100km)
    CONSUMPTION_PER_100KM: 25,
    
    // Consommation moyenne au litre par km
    CONSUMPTION_PER_KM: 0.25
  },

  // ========== Coûts ==========
  COSTS: {
    // Prix moyen carburant (€/L)
    DIESEL_AVG_PRICE: 1.65,
    GASOLINE_AVG_PRICE: 1.55,
    
    // Coût moyen maintenance par km (€)
    MAINTENANCE_PER_KM: 0.15,
    
    // Coût horaire moyen agent (€)
    HOURLY_AGENT_COST: 25
  },

  // ========== Performance Agents ==========
  AGENTS: {
    // Seuil de performance (%)
    EXCELLENT_THRESHOLD: 90,
    GOOD_THRESHOLD: 75,
    NEEDS_IMPROVEMENT_THRESHOLD: 50,
    
    // Points par action
    POINTS_PER_ROUTE: 10,
    POINTS_PER_CONTAINER: 2,
    POINTS_PER_REPORT: 5,
    POINTS_BONUS_ECO: 15
  },

  // ========== Tournées ==========
  ROUTES: {
    // Durée moyenne optimale (min)
    OPTIMAL_DURATION: 120,
    
    // Distance moyenne optimale (km)
    OPTIMAL_DISTANCE: 45,
    
    // Capacité conteneurs
    MAX_CONTAINERS: 12
  },

  // ========== Conteneurs ==========
  CONTAINERS: {
    // Seuil critique (%)
    CRITICAL_THRESHOLD: 80,
    
    // Seuil warning (%)
    WARNING_THRESHOLD: 60,
    
    // Capacité moyenne (L)
    AVG_CAPACITY: 1100
  }
};

/**
 * Calculer les équivalences environnementales
 */
ENVIRONMENTAL_CONSTANTS.calculateEquivalents = function(co2Kg) {
  return {
    trees: Math.round(co2Kg / this.EQUIVALENTS.PER_TREE_YEAR),
    carKm: Math.round(co2Kg / this.EQUIVALENTS.PER_CAR_KM),
    kWh: Math.round(co2Kg / this.EQUIVALENTS.PER_KWH)
  };
};

/**
 * Calculer le CO2 économisé (kg)
 */
ENVIRONMENTAL_CONSTANTS.calculateCO2Saved = function(kmSaved, fuelSavedLiters = null) {
  if (fuelSavedLiters !== null) {
    return fuelSavedLiters * this.CO2.DEFAULT_PER_LITER;
  }
  return kmSaved * this.CO2.DEFAULT_PER_KM;
};

/**
 * Calculer les coûts économisés
 */
ENVIRONMENTAL_CONSTANTS.calculateCostsSaved = function(kmSaved, fuelSavedLiters) {
  const fuelCost = fuelSavedLiters * this.COSTS.DIESEL_AVG_PRICE;
  const maintenanceCost = kmSaved * this.COSTS.MAINTENANCE_PER_KM;
  return {
    fuel: Math.round(fuelCost * 100) / 100,
    maintenance: Math.round(maintenanceCost * 100) / 100,
    total: Math.round((fuelCost + maintenanceCost) * 100) / 100
  };
};

/**
 * Calculer le fuel économisé
 */
ENVIRONMENTAL_CONSTANTS.calculateFuelSaved = function(kmSaved) {
  return Math.round(kmSaved * this.FUEL.CONSUMPTION_PER_KM * 100) / 100;
};

module.exports = ENVIRONMENTAL_CONSTANTS;
