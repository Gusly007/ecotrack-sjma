/**
 * Stats Controller — Phase 5 : Statistiques & Monitoring
 *
 * Gère les requêtes HTTP pour les endpoints de statistiques.
 * Chaque méthode renvoie un JSON standardisé { success, data, timestamp }.
 */
class StatsController {
  constructor(service) {
    this.service = service;

    // Binding pour Express
    this.getDashboard = this.getDashboard.bind(this);
    this.getGlobalStats = this.getGlobalStats.bind(this);
    this.getFillLevelDistribution = this.getFillLevelDistribution.bind(this);
    this.getStatsByZone = this.getStatsByZone.bind(this);
    this.getStatsByType = this.getStatsByType.bind(this);
    this.getAlertsSummary = this.getAlertsSummary.bind(this);
    this.getCriticalContainers = this.getCriticalContainers.bind(this);
    this.getFillHistory = this.getFillHistory.bind(this);
    this.getCollectionStats = this.getCollectionStats.bind(this);
    this.getMaintenanceStats = this.getMaintenanceStats.bind(this);
  }

  /**
   * Réponse standardisée
   */
  _success(res, data, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Gestion d'erreur standardisée
   */
  _error(res, err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: err.message,
        timestamp: new Date().toISOString(),
      });
    }
    console.error('[StatsController] Erreur:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      timestamp: new Date().toISOString(),
    });
  }

  // ── GET /api/stats/dashboard ──
  async getDashboard(req, res) {
    try {
      const data = await this.service.getDashboard();
      return this._success(res, data);
    } catch (err) {
      return this._error(res, err);
    }
  }

  // ── GET /api/stats ──
  async getGlobalStats(req, res) {
    try {
      const data = await this.service.getGlobalStats();
      return this._success(res, data);
    } catch (err) {
      return this._error(res, err);
    }
  }

  // ── GET /api/stats/fill-levels ──
  async getFillLevelDistribution(req, res) {
    try {
      const data = await this.service.getFillLevelDistribution();
      return this._success(res, data);
    } catch (err) {
      return this._error(res, err);
    }
  }

  // ── GET /api/stats/by-zone ──
  async getStatsByZone(req, res) {
    try {
      const data = await this.service.getStatsByZone();
      return this._success(res, data);
    } catch (err) {
      return this._error(res, err);
    }
  }

  // ── GET /api/stats/by-type ──
  async getStatsByType(req, res) {
    try {
      const data = await this.service.getStatsByType();
      return this._success(res, data);
    } catch (err) {
      return this._error(res, err);
    }
  }

  // ── GET /api/stats/alerts ──
  async getAlertsSummary(req, res) {
    try {
      const data = await this.service.getAlertsSummary();
      return this._success(res, data);
    } catch (err) {
      return this._error(res, err);
    }
  }

  // ── GET /api/stats/critical?seuil=90 ──
  async getCriticalContainers(req, res) {
    try {
      const seuil = Number(req.query.seuil) || 90;
      const data = await this.service.getCriticalContainers(seuil);
      return this._success(res, data);
    } catch (err) {
      return this._error(res, err);
    }
  }

  // ── GET /api/stats/containers/:id/history?days=30&limit=500 ──
  async getFillHistory(req, res) {
    try {
      const { id } = req.params;
      const { days, limit } = req.query;
      const data = await this.service.getFillHistory(id, { days, limit });
      return this._success(res, data);
    } catch (err) {
      return this._error(res, err);
    }
  }

  // ── GET /api/stats/collections?days=30 ──
  async getCollectionStats(req, res) {
    try {
      const { days } = req.query;
      const data = await this.service.getCollectionStats({ days });
      return this._success(res, data);
    } catch (err) {
      return this._error(res, err);
    }
  }

  // ── GET /api/stats/maintenance ──
  async getMaintenanceStats(req, res) {
    try {
      const data = await this.service.getMaintenanceStats();
      return this._success(res, data);
    } catch (err) {
      return this._error(res, err);
    }
  }
}

module.exports = StatsController;
