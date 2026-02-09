const Validators = require('../utils/Validators');

class ZoneService {
    constructor(zoneModel) {
        this.zoneModel = zoneModel;
    }

    /**
     * Crée une nouvelle zone
     */
    async createZone(zoneData) {
        Validators.validateZoneData(zoneData); // Validation des données de zone
        return await this.zoneModel.addZone(zoneData);
    }

    /**
     * Récupère toutes les zones
     */
    async getAllZones(page = 1, limit = 10) {
        Validators.validatePagination(page, limit); // Validation pagination
        return await this.zoneModel.getAllZones(page, limit);
    }

    /**
     * Récupère une zone par ID
     */
    async getZoneById(id) {
        Validators.validateZoneId(id); // Validation ID zone
        return await this.zoneModel.getZoneById(id);
    }

    /**
     * Récupère une zone par son code
     */
    async getZoneByCode(code) {
        Validators.validateCode(code, 'code'); // Validation code zone
        return await this.zoneModel.getZoneByCode(code);
    }

    /**
     * Met à jour une zone
     */
    async updateZone(id, zoneData) {
        Validators.validateZoneId(id); // Validation ID zone
        Validators.validateZoneData(zoneData, { isUpdate: true }); // Validation données zone
        return await this.zoneModel.updateZone(id, zoneData);
    }

    /**
     * Supprime une zone
     */
    async deleteZone(id) {
        Validators.validateZoneId(id); // Validation ID zone
        return await this.zoneModel.deleteZone(id);
    }

    /**
     * Supprime toutes les zones
     */
    async deleteAllZones() {
        return await this.zoneModel.deleteAllZones();
    }

    /**
     * Recherche les zones par nom
     */
    async searchZonesByName(nom) {
        Validators.validateNonEmptyString(nom, 'nom', 2); // Validation nom
        return await this.zoneModel.searchZonesByName(nom);
    }

    /**
     * Récupère les zones dans un rayon
     */
    async getZonesInRadius(latitude, longitude, radiusKm) {
        Validators.validateCoordinates(latitude, longitude); // Validation coordonnées
        Validators.validateRadius(radiusKm); // Validation rayon
        return await this.zoneModel.getZonesInRadius(latitude, longitude, radiusKm);
    }

    /**
     * Récupère les statistiques des zones
     */
    async getZoneStatistics() {
        return await this.zoneModel.getZoneStatistics();
    }

    /**
     * Compte le nombre de zones
     */
    async countZones() {
        return await this.zoneModel.countZones();
    }

    /**
     * Vérifie si une zone existe
     */
    async zoneExists(id) {
        Validators.validateZoneId(id); // Validation ID zone
        return await this.zoneModel.zoneExists(id);
    }

    /**
     * Vérifie si un code de zone existe
     */
    async codeExists(code) {
        Validators.validateCode(code, 'code'); // Validation code zone
        return await this.zoneModel.codeExists(code);
    }
}

module.exports = ZoneService;
