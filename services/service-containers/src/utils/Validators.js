/**
 * Validateurs de données
 */
class Validators {
  /**
   * Valide les coordonnées GPS
   */
  static validateGPS(latitude, longitude) {
    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude invalide: doit être entre -90 et 90');
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude invalide: doit être entre -180 et 180');
    }
    return true;
  }

  /**
   * Valide une capacité en litres
   */
  static validateCapacite(capacite) {
    if (!Number.isInteger(capacite) || capacite < 100 || capacite > 5000) {
      throw new Error('Capacité invalide: doit être un nombre entier entre 100 et 5000');
    }
    return true;
  }

  /**
   * Valide un statut de conteneur
   */
  static validateStatut(statut) {
    const validStatuts = ['ACTIF', 'INACTIF', 'EN_MAINTENANCE', 'HORS_SERVICE'];
    if (!validStatuts.includes(statut)) {
      throw new Error(
        `Statut invalide: "${statut}". Valeurs acceptées: ${validStatuts.join(', ')}`
      );
    }
    return true;
  }

  /**
   * Valide l'email
   */
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Email invalide');
    }
    return true;
  }

  /**
   * Valide un nombre positif
   */
  static validatePositiveNumber(value, fieldName = 'valeur') {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`${fieldName} invalide: doit être un nombre entier positif`);
    }
    return true;
  }

  /**
   * Valide une chaîne non vide
   */
  static validateNonEmptyString(value, fieldName = 'valeur', minLength = 1) {
    if (typeof value !== 'string' || value.trim().length < minLength) {
      throw new Error(
        `${fieldName} invalide: doit être une chaîne non vide (minimum ${minLength} caractères)`
      );
    }
    return true;
  }

  /**
   * Valide les options de pagination
   */
  static validatePagination(page, limit) {
    if (!Number.isInteger(page) || page < 1) {
      throw new Error('Page invalide: doit être un nombre entier >= 1');
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 1000) {
      throw new Error('Limite invalide: doit être un nombre entier entre 1 et 1000');
    }
    return true;
  }
}

module.exports = Validators;
