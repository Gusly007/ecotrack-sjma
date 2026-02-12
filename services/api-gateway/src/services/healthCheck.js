import axios from 'axios';

/**
 * Service de Health Check avancé pour l'API Gateway
 * Vérifie le statut de tous les services dépendants
 */

class HealthCheckService {
  constructor() {
    this.services = new Map();
    this.checkInterval = parseInt(process.env.HEALTH_CHECK_INTERVAL, 10) || 30000; // 30s
    this.timeout = parseInt(process.env.HEALTH_CHECK_TIMEOUT, 10) || 5000; // 5s
    this.allowedHosts = new Set((process.env.ALLOWED_HEALTH_CHECK_HOSTS || 'localhost,127.0.0.1').split(','));
    
    // Démarrer les vérifications périodiques
    this.startPeriodicChecks();
  }

  /**
   * Valider que l'URL est autorisée pour prévenir les attaques SSRF
   */
  isUrlAllowed(url) {
    try {
      const urlObj = new URL(url);
      return this.allowedHosts.has(urlObj.hostname);
    } catch {
      return false;
    }
  }

  /**
   * Enregistrer un service à surveiller
   */
  registerService(name, config) {
    this.services.set(name, {
      name,
      displayName: config.displayName,
      baseUrl: config.baseUrl,
      healthEndpoint: config.healthEndpoint || '/health',
      status: 'unknown',
      lastCheck: null,
      latency: null,
      error: null,
      consecutiveFailures: 0,
      maxFailures: 3
    });
  }

  /**
   * Vérifier la santé d'un service spécifique
   */
  async checkService(name) {
    const service = this.services.get(name);
    
    if (!service || !service.baseUrl) {
      return {
        name,
        status: 'pending',
        message: 'Service not configured'
      };
    }

    const startTime = Date.now();
    const fullUrl = `${service.baseUrl}${service.healthEndpoint}`;
    
    // Valider l'URL pour prévenir les attaques SSRF
    if (!this.isUrlAllowed(fullUrl)) {
      throw new Error(`URL not allowed: ${fullUrl}`);
    }
    
    try {
      const response = await axios.get(
        fullUrl,
        {
          timeout: this.timeout,
          validateStatus: (status) => status < 500 // Accepte 200-499
        }
      );

      const latency = Date.now() - startTime;
      
      // Réinitialiser les échecs consécutifs
      service.consecutiveFailures = 0;
      service.status = 'up';
      service.lastCheck = new Date().toISOString();
      service.latency = `${latency}ms`;
      service.error = null;

      return {
        name: service.displayName || name,
        status: 'up',
        latency: `${latency}ms`,
        lastCheck: service.lastCheck,
        details: response.data
      };
    } catch (err) {
      service.consecutiveFailures++;
      service.status = service.consecutiveFailures >= service.maxFailures ? 'down' : 'degraded';
      service.lastCheck = new Date().toISOString();
      service.latency = null;
      service.error = err.message;

      return {
        name: service.displayName || name,
        status: service.status,
        lastCheck: service.lastCheck,
        error: err.message,
        consecutiveFailures: service.consecutiveFailures
      };
    }
  }

  /**
   * Vérifier tous les services
   */
  async checkAllServices() {
    const results = [];
    
    for (const [name] of this.services) {
      const result = await this.checkService(name);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Obtenir le statut global
   */
  async getOverallStatus() {
    const services = await this.checkAllServices();
    
    const downServices = services.filter(s => s.status === 'down');
    const degradedServices = services.filter(s => s.status === 'degraded');
    
    let overallStatus = 'healthy';
    if (downServices.length > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedServices.length > 0) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      gateway: {
        status: 'up',
        version: process.env.npm_package_version || '1.0.0',
        nodeVersion: process.version
      },
      services: services.reduce((acc, service) => {
        acc[service.name] = {
          status: service.status,
          latency: service.latency,
          lastCheck: service.lastCheck,
          error: service.error
        };
        return acc;
      }, {})
    };
  }

  /**
   * Démarrer les vérifications périodiques
   */
  startPeriodicChecks() {
    setInterval(async () => {
      console.log('🔍 Running periodic health checks...');
      await this.checkAllServices();
    }, this.checkInterval);
  }

  /**
   * Arrêter les vérifications
   */
  stopPeriodicChecks() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  /**
   * Obtenir le statut d'un service spécifique (sans vérification)
   */
  getServiceStatus(name) {
    const service = this.services.get(name);
    if (!service) return null;
    
    return {
      name: service.displayName || name,
      status: service.status,
      latency: service.latency,
      lastCheck: service.lastCheck,
      error: service.error
    };
  }

  /**
   * Obtenir tous les services enregistrés
   */
  getAllServices() {
    return Array.from(this.services.values()).map(s => ({
      name: s.displayName || s.name,
      status: s.status,
      baseUrl: s.baseUrl
    }));
  }
}

// Singleton
const healthCheckService = new HealthCheckService();

export default healthCheckService;
export { HealthCheckService };
