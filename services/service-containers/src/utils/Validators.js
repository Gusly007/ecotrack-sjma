/**
 * Validateurs de données
 */
class Validators {
  /**
   * Lance une erreur de validation standardisée
   */
  static throwValidationError(message) {
    const error = new Error(message);
    error.name = 'ValidationError';
    throw error;
  }

  /**
   * Valide l'ID d'un conteneur
   */ 
  static validateContainerId(id) {
    if (!Number.isInteger(id) || id <= 0) {
      Validators.throwValidationError('ID de conteneur invalide: doit être un nombre entier positif');
    }
  }
  /**
   * Valide l'UID d'un conteneur
   */
  static validateContainerUid(uid) {
    const uidRegex = /^CNT-[A-Z0-9]{12}$/;
    if (typeof uid !== 'string' || !uidRegex.test(uid)) {
      Validators.throwValidationError('UID de conteneur invalide: doit respecter le format CNT-XXXXXXXXXXXX');
    }
  }
  /**
   * Valide les coordonnées GPS
   */
  static validateGPS(latitude, longitude) {
    if (latitude < -90 || latitude > 90) {
      Validators.throwValidationError('Latitude invalide: doit être entre -90 et 90');
    }
    if (longitude < -180 || longitude > 180) {
      Validators.throwValidationError('Longitude invalide: doit être entre -180 et 180');
    }
    return true;
  }

  /**
   * Alias pour validateGPS (compatibilité)
   */
  static validateCoordinates(latitude, longitude) {
    return Validators.validateGPS(latitude, longitude);
  }

  /**
   * Valide une capacité en litres
   */
  static validateCapacite(capacite) {
    if (!Number.isInteger(capacite) || capacite < 100 || capacite > 5000) {
      Validators.throwValidationError('Capacité invalide: doit être un nombre entier entre 100 et 5000');
    }
    return true;
  }

  /**
   * Valide un statut de conteneur
   */
  static validateStatut(statut) {
    const validStatuts = ['ACTIF', 'INACTIF', 'EN_MAINTENANCE', 'HORS_SERVICE'];
    if (!validStatuts.includes(statut)) {
      Validators.throwValidationError(
        `Statut invalide: "${statut}". Valeurs acceptées: ${validStatuts.join(', ')}`
      );
    }
    return true;
  }

  /**
   * Valide un rayon en km
   */
  static validateRadius(radiusKm) {
    if (typeof radiusKm !== 'number' || Number.isNaN(radiusKm) || radiusKm <= 0) {
      Validators.throwValidationError('Rayon invalide: doit être un nombre strictement positif');
    }
    return true;
  }

  /**
   * Valide l'ID d'une zone
   */
  static validateZoneId(id) {
    if (!Number.isInteger(id) || id <= 0) {
      Validators.throwValidationError('ID de zone invalide: doit être un nombre entier positif');
    }
    return true;
  }

  /**
   * Valide l'ID d'un type de conteneur
   */
  static validateTypeConteneurId(id) {
    if (!Number.isInteger(id) || id <= 0) {
      Validators.throwValidationError('ID de type de conteneur invalide: doit être un nombre entier positif');
    }
    return true;
  }

  /**
   * Valide un code générique
   */
  static validateCode(code, fieldName = 'code', minLength = 2, maxLength = 50) {
    Validators.validateNonEmptyString(code, fieldName, minLength);
    if (code.length > maxLength) {
      Validators.throwValidationError(`${fieldName} invalide: longueur maximale ${maxLength} caractères`);
    }
    return true;
  }

  /**
   * Valide le nom d'un type de conteneur
   */
  static validateTypeConteneurNom(nom) {
    const validNoms = ['ORDURE', 'RECYCLAGE', 'VERRE', 'COMPOST'];
    if (!validNoms.includes(nom)) {
      Validators.throwValidationError(
        `Nom de type conteneur invalide: "${nom}". Valeurs acceptées: ${validNoms.join(', ')}`
      );
    }
    return true;
  }

  /**
   * Valide les données d'un conteneur
   */
  static validateContainerData(data, options = {}) {
    const { isUpdate = false } = options;

    if (!data || typeof data !== 'object') {
      Validators.throwValidationError('Données de conteneur invalides');
    }

    const allowedFields = ['capacite_l', 'statut', 'latitude', 'longitude', 'id_zone', 'id_type'];
    const keys = Object.keys(data);
    if (keys.some((key) => !allowedFields.includes(key))) {
      Validators.throwValidationError('Données de conteneur invalides: champ non autorisé');
    }

    if (isUpdate && keys.length === 0) {
      Validators.throwValidationError('Aucun champ à mettre à jour');
    }

    if (Object.prototype.hasOwnProperty.call(data, 'capacite_l')) {
      Validators.validateCapacite(data.capacite_l);
    } else if (!isUpdate) {
      Validators.throwValidationError('Champ requis manquant: capacite_l');
    }

    if (Object.prototype.hasOwnProperty.call(data, 'statut')) {
      if (isUpdate) {
        Validators.throwValidationError('Le statut doit être modifié via la méthode updateStatus dédiée');
      }
      Validators.validateStatut(data.statut);
    } else if (!isUpdate) {
      Validators.throwValidationError('Champ requis manquant: statut');
    }

    const hasLatitude = Object.prototype.hasOwnProperty.call(data, 'latitude');
    const hasLongitude = Object.prototype.hasOwnProperty.call(data, 'longitude');
    if (hasLatitude || hasLongitude) {
      if (!hasLatitude || !hasLongitude) {
        Validators.throwValidationError('Latitude et longitude doivent être fournies ensemble');
      }
      Validators.validateCoordinates(data.latitude, data.longitude);
    } else if (!isUpdate) {
      Validators.throwValidationError('Champs requis manquants: latitude, longitude');
    }

    if (Object.prototype.hasOwnProperty.call(data, 'id_zone') && data.id_zone !== null) {
      Validators.validateZoneId(data.id_zone);
    }

    if (Object.prototype.hasOwnProperty.call(data, 'id_type') && data.id_type !== null) {
      Validators.validateTypeConteneurId(data.id_type);
    }

    return true;
  }

  /**
   * Valide les données d'une zone
   */
  static validateZoneData(data, options = {}) {
    const { isUpdate = false } = options;

    if (!data || typeof data !== 'object') {
      Validators.throwValidationError('Données de zone invalides');
    }

    const allowedFields = ['code', 'nom', 'population', 'superficie_km2', 'latitude', 'longitude'];
    const keys = Object.keys(data);
    if (keys.some((key) => !allowedFields.includes(key))) {
      Validators.throwValidationError('Données de zone invalides: champ non autorisé');
    }

    if (isUpdate && keys.length === 0) {
      Validators.throwValidationError('Aucun champ à mettre à jour');
    }

    if (Object.prototype.hasOwnProperty.call(data, 'code')) {
      Validators.validateCode(data.code, 'code', 2, 50);
    } else if (!isUpdate) {
      Validators.throwValidationError('Champ requis manquant: code');
    }

    if (Object.prototype.hasOwnProperty.call(data, 'nom')) {
      Validators.validateNonEmptyString(data.nom, 'nom', 2);
    } else if (!isUpdate) {
      Validators.throwValidationError('Champ requis manquant: nom');
    }

    if (Object.prototype.hasOwnProperty.call(data, 'population')) {
      if (!Number.isInteger(data.population) || data.population < 0) {
        Validators.throwValidationError('Population invalide: doit être un entier positif');
      }
    } else if (!isUpdate) {
      Validators.throwValidationError('Champ requis manquant: population');
    }

    if (Object.prototype.hasOwnProperty.call(data, 'superficie_km2')) {
      if (typeof data.superficie_km2 !== 'number' || Number.isNaN(data.superficie_km2) || data.superficie_km2 < 0) {
        Validators.throwValidationError('Superficie invalide: doit être un nombre positif');
      }
    } else if (!isUpdate) {
      Validators.throwValidationError('Champ requis manquant: superficie_km2');
    }

    const hasLatitude = Object.prototype.hasOwnProperty.call(data, 'latitude');
    const hasLongitude = Object.prototype.hasOwnProperty.call(data, 'longitude');
    if (hasLatitude || hasLongitude) {
      if (!hasLatitude || !hasLongitude) {
        Validators.throwValidationError('Latitude et longitude doivent être fournies ensemble');
      }
      Validators.validateCoordinates(data.latitude, data.longitude);
    } else if (!isUpdate) {
      Validators.throwValidationError('Champs requis manquants: latitude, longitude');
    }

    return true;
  }

  /**
   * Valide les données d'un type de conteneur
   */
  static validateTypeConteneurData(data, options = {}) {
    const { isUpdate = false } = options;

    if (!data || typeof data !== 'object') {
      Validators.throwValidationError('Données de type conteneur invalides');
    }

    const allowedFields = ['code', 'nom'];
    const keys = Object.keys(data);
    if (keys.some((key) => !allowedFields.includes(key))) {
      Validators.throwValidationError('Données de type conteneur invalides: champ non autorisé');
    }

    if (isUpdate && keys.length === 0) {
      Validators.throwValidationError('Aucun champ à mettre à jour');
    }

    if (Object.prototype.hasOwnProperty.call(data, 'code')) {
      Validators.validateCode(data.code, 'code', 2, 50);
    } else if (!isUpdate) {
      Validators.throwValidationError('Champ requis manquant: code');
    }

    if (Object.prototype.hasOwnProperty.call(data, 'nom')) {
      Validators.validateTypeConteneurNom(data.nom);
    } else if (!isUpdate) {
      Validators.throwValidationError('Champ requis manquant: nom');
    }

    return true;
  }

  /**
   * Valide l'email
   */
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Validators.throwValidationError('Email invalide');
    }
    return true;
  }

  /**
   * Valide un nombre positif
   */
  static validatePositiveNumber(value, fieldName = 'valeur') {
    if (!Number.isInteger(value) || value <= 0) {
      Validators.throwValidationError(`${fieldName} invalide: doit être un nombre entier positif`);
    }
    return true;
  }

  /**
   * Valide une chaîne non vide
   */
  static validateNonEmptyString(value, fieldName = 'valeur', minLength = 1) {
    if (typeof value !== 'string' || value.trim().length < minLength) {
      Validators.throwValidationError(
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
      Validators.throwValidationError('Page invalide: doit être un nombre entier >= 1');
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 1000) {
      Validators.throwValidationError('Limite invalide: doit être un nombre entier entre 1 et 1000');
    }
    return true;
  }
}

module.exports = Validators;
