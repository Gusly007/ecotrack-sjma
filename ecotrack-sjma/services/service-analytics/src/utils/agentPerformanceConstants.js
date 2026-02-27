/**
 * Constantes pour le calcul de performance des agents - ECOTRACK
 */
const AGENT_PERFORMANCE_CONSTANTS = {
  // ========== Pondération pour le calcul du score global ==========
  // Score global = collection_rate * 0.4 + completion_rate * 0.3 + time_efficiency * 0.15 + distance_efficiency * 0.15
  WEIGHTS: {
    COLLECTION_RATE: 0.4,         // 40% : collecte effective
    COMPLETION_RATE: 0.3,         // 30% : complétion tournées
    TIME_EFFICIENCY: 0.15,        // 15% : respect temps
    DISTANCE_EFFICIENCY: 0.15    // 15% : respect distance
  },
  
};

module.exports = AGENT_PERFORMANCE_CONSTANTS;
