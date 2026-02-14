const Validators = require('../utils/Validators');

class ZoneService {
    constructor(zoneRepository) {
        this.zoneRepository = zoneRepository;
    }

    /**
     * Crée une nouvelle zone
     */
    async createZone(zoneData) {
        Validators.validateZoneData(zoneData); // Validation des données de zone
        return await this.zoneRepository.addZone(zoneData);
    }

    /**
     * Récupère toutes les zones
     */
    async getAllZones(page = 1, limit = 10) {
        Validators.validatePagination(page, limit); // Validation pagination
        return await this.zoneRepository.getAllZones(page, limit);
    }

    /**
     * Récupère une zone par ID
     */
    async getZoneById(id) {
        Validators.validateZoneId(id); // Validation ID zone
        return await this.zoneRepository.getZoneById(id);
    }

    /**
     * Récupère une zone par son code
     */
    async getZoneByCode(code) {
        Validators.validateCode(code, 'code'); // Validation code zone
        return await this.zoneRepository.getZoneByCode(code);
    }

    /**
     * Met à jour une zone
     */
    async updateZone(id, zoneData) {
        Validators.validateZoneId(id); // Validation ID zone
        Validators.validateZoneData(zoneData, { isUpdate: true }); // Validation données zone
        return await this.zoneRepository.updateZone(id, zoneData);
    }

    /**
     * Supprime une zone
     */
    async deleteZone(id) {
        Validators.validateZoneId(id); // Validation ID zone
        return await this.zoneRepository.deleteZone(id);
    }

    /**
     * Supprime toutes les zones
     */
    async deleteAllZones() {
        return await this.zoneRepository.deleteAllZones();
    }

    /**
     * Recherche les zones par nom
     */
    async searchZonesByName(nom) {
        Validators.validateNonEmptyString(nom, 'nom', 2); // Validation nom
        return await this.zoneRepository.searchZonesByName(nom);
    }

    /**
     * Récupère les zones dans un rayon
     */
    async getZonesInRadius(latitude, longitude, radiusKm) {
        Validators.validateCoordinates(latitude, longitude); // Validation coordonnées
        Validators.validateRadius(radiusKm); // Validation rayon
        return await this.zoneRepository.getZonesInRadius(latitude, longitude, radiusKm);
    }

    /**
     * Récupère les statistiques des zones
     */
    async getZoneStatistics() {
        return await this.zoneRepository.getZoneStatistics();
    }

    /**
     * Compte le nombre de zones
     */
    async countZones() {
        return await this.zoneRepository.countZones();
    }

    /**
     * Vérifie si une zone existe
     */
    async zoneExists(id) {
        Validators.validateZoneId(id); // Validation ID zone
        return await this.zoneRepository.zoneExists(id);
    }

    /**
     * Vérifie si un code de zone existe
     */
    async codeExists(code) {
        Validators.validateCode(code, 'code'); // Validation code zone
        return await this.zoneRepository.codeExists(code);
    }
}

module.exports = ZoneService;
