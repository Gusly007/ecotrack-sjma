/**
 * Stats Service — Phase 5 : Statistiques & Monitoring
 *
 * Couche métier entre le contrôleur et le modèle.
 * Responsabilités : validation des paramètres, logique de composition,
 * agrégation de résultats provenant de différentes méthodes du modèle.
 */
class StatsService {
  constructor(statsRepository) {
    this.repository = statsRepository;
  }

  /**
   * Tableau de bord global (appelle plusieurs méthodes en parallèle)
   */
  async getDashboard() {
    const [global, fillLevels, alerts] = await Promise.all([
      this.repository.getGlobalStats(),
      this.repository.getFillLevelDistribution(),
      this.repository.getAlertsSummary(),
    ]);

    return {
      conteneurs: global,
      remplissage: fillLevels,
      alertes: {
        total_actives: alerts.total_alertes_actives,
        debordements: alerts.debordements,
        batteries_faibles: alerts.batteries_faibles,
        capteurs_defaillants: alerts.capteurs_defaillants,
      },
    };
  }

  /**
   * Stats globales des conteneurs
   */
  async getGlobalStats() {
    return this.repository.getGlobalStats();
  }

  /**
   * Distribution des niveaux de remplissage
   */
  async getFillLevelDistribution() {
    return this.repository.getFillLevelDistribution();
  }

  /**
   * Stats par zone
   */
  async getStatsByZone() {
    return this.repository.getStatsByZone();
  }

  /**
   * Stats par type de conteneur
   */
  async getStatsByType() {
    return this.repository.getStatsByType();
  }

  /**
   * Résumé des alertes actives
   */
  async getAlertsSummary() {
    return this.repository.getAlertsSummary();
  }

  /**
   * Conteneurs critiques (remplissage >= seuil OU EN_MAINTENANCE)
   * @param {number} seuil - Pourcentage minimum de remplissage (défaut 90)
   */
  async getCriticalContainers(seuil = 90) {
    if (seuil < 0 || seuil > 100) {
      const err = new Error('Le seuil de remplissage doit être entre 0 et 100');
      err.name = 'ValidationError';
      throw err;
    }
    return this.repository.getCriticalContainers(seuil);
  }

  /**
   * Historique de remplissage d'un conteneur (pour graphiques)
   * @param {number} id - ID du conteneur
   * @param {Object} options - { days, limit }
   */
  async getFillHistory(id, options = {}) {
    if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
      const err = new Error('ID de conteneur invalide');
      err.name = 'ValidationError';
      throw err;
    }
    const days = Math.min(Math.max(Number(options.days) || 30, 1), 365);
    const limit = Math.min(Math.max(Number(options.limit) || 500, 1), 5000);
    return this.repository.getFillHistory(Number(id), { days, limit });
  }

  /**
   * Stats de collecte sur une période
   * @param {Object} options - { days }
   */
  async getCollectionStats(options = {}) {
    const days = Math.min(Math.max(Number(options.days) || 30, 1), 365);
    return this.repository.getCollectionStats({ days });
  }

  /**
   * Stats de maintenance
   */
  async getMaintenanceStats() {
    return this.repository.getMaintenanceStats();
  }
}

module.exports = StatsService;
