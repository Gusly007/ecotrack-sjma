/**
 * Service de notifications
 * Envoie les alertes au service-users pour notification des gestionnaires
 */
const logger = require('../utils/logger');
const config = require('../config/config');

class NotificationService {
  constructor() {
    this.baseUrl = config.USERS_SERVICE.baseUrl;
    this.timeout = config.USERS_SERVICE.timeout;
    this.enabled = config.ALERTS.NOTIFICATIONS_ENABLED;
  }

  /**
   * Envoie une notification d'alerte au service-users
   */
  async sendAlertNotification(alert, container) {
    if (!this.enabled) {
      logger.info({ alertId: alert.id_alerte }, 'Notifications disabled, skipping');
      return null;
    }

    try {
      const notification = {
        type: 'ALERTE_IOT',
        titre: this._getAlertTitle(alert.type_alerte),
        corps: alert.description,
        id_conteneur: alert.id_conteneur,
        priorite: this._getAlertPriority(alert.type_alerte),
        data: {
          id_alerte: alert.id_alerte,
          type_alerte: alert.type_alerte,
          valeur_detectee: alert.valeur_detectee,
          seuil: alert.seuil,
          id_zone: container?.id_zone
        }
      };

      const response = await this._callServiceUsers('/api/notifications', 'POST', notification);
      
      logger.info({
        alertId: alert.id_alerte,
        notificationId: response?.id
      }, 'Alert notification sent');
      
      return response;
    } catch (error) {
      logger.error({
        alertId: alert.id_alerte,
        error: error.message
      }, 'Failed to send alert notification');
      return null;
    }
  }

  /**
   * Envoie une notification de résolution d'alerte
   */
  async sendResolutionNotification(alert) {
    if (!this.enabled) {
      return null;
    }

    try {
      const notification = {
        type: 'ALERTE_RESOLUE',
        titre: 'Alerte résolue',
        corps: `L'alerte "${alert.type_alerte}" a été résolue`,
        id_conteneur: alert.id_conteneur,
        priorite: 'basse',
        data: {
          id_alerte: alert.id_alerte,
          type_alerte: alert.type_alerte
        }
      };

      await this._callServiceUsers('/api/notifications', 'POST', notification);
      
      logger.info({ alertId: alert.id_alerte }, 'Resolution notification sent');
      return true;
    } catch (error) {
      logger.error({
        alertId: alert.id_alerte,
        error: error.message
      }, 'Failed to send resolution notification');
      return null;
    }
  }

  /**
   * Appelle le service-users
   */
  async _callServiceUsers(path, method, body) {
    const url = `${this.baseUrl}${path}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * Génère le titre de l'alerte
   */
  _getAlertTitle(typeAlerte) {
    const titles = {
      'DEBORDEMENT': ' Conteneur presque plein',
      'BATTERIE_FAIBLE': ' Batterie faible',
      'CAPTEUR_DEFAILLANT': ' Capteur défaillant'
    };
    return titles[typeAlerte] || 'Alerte IoT';
  }

  /**
   * Détermine la priorité selon le type d'alerte
   */
  _getAlertPriority(typeAlerte) {
    const priorities = {
      'DEBORDEMENT': 'haute',
      'BATTERIE_FAIBLE': 'moyenne',
      'CAPTEUR_DEFAILLANT': 'basse'
    };
    return priorities[typeAlerte] || 'moyenne';
  }

  /**
   * Teste la connexion au service-users
   */
  async testConnection() {
    try {
      const url = `${this.baseUrl}/health`;
      const response = await fetch(url, { 
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      return response.ok;
    } catch (error) {
      logger.warn({ error: error.message }, 'Service-users not reachable');
      return false;
    }
  }
}

module.exports = NotificationService;
