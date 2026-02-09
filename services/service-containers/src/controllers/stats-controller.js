/**
 * Stats Controller — Phase 5 : Statistiques & Monitoring
 *
 * Gere les requetes HTTP pour les endpoints de statistiques.
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

  // ── GET /api/stats/dashboard ──
  async getDashboard(req, res, next) {
    try {
      const data = await this.service.getDashboard();
      return res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  // ── GET /api/stats ──
  async getGlobalStats(req, res, next) {
    try {
      const data = await this.service.getGlobalStats();
      return res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  // ── GET /api/stats/fill-levels ──
  async getFillLevelDistribution(req, res, next) {
    try {
      const data = await this.service.getFillLevelDistribution();
      return res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  // ── GET /api/stats/by-zone ──
  async getStatsByZone(req, res, next) {
    try {
      const data = await this.service.getStatsByZone();
      return res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  // ── GET /api/stats/by-type ──
  async getStatsByType(req, res, next) {
    try {
      const data = await this.service.getStatsByType();
      return res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  // ── GET /api/stats/alerts ──
  async getAlertsSummary(req, res, next) {
    try {
      const data = await this.service.getAlertsSummary();
      return res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  // ── GET /api/stats/critical?seuil=90 ──
  async getCriticalContainers(req, res, next) {
    try {
      const seuil = Number(req.query.seuil) || 90;
      const data = await this.service.getCriticalContainers(seuil);
      return res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  // ── GET /api/stats/containers/:id/history?days=30&limit=500 ──
  async getFillHistory(req, res, next) {
    try {
      const { id } = req.params;
      const { days, limit } = req.query;
      const data = await this.service.getFillHistory(id, { days, limit });
      return res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  // ── GET /api/stats/collections?days=30 ──
  async getCollectionStats(req, res, next) {
    try {
      const { days } = req.query;
      const data = await this.service.getCollectionStats({ days });
      return res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }

  // ── GET /api/stats/maintenance ──
  async getMaintenanceStats(req, res, next) {
    try {
      const data = await this.service.getMaintenanceStats();
      return res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = StatsController;
