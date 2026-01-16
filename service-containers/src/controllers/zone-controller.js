class ZoneController {
    constructor(service) {
        this.service = service;

        // 🔒 Binding pour Express - assure que 'this' est correct dans les route handlers
        this.create = this.create.bind(this);
        this.getAll = this.getAll.bind(this);
        this.getById = this.getById.bind(this);
        this.getByCode = this.getByCode.bind(this);
        this.update = this.update.bind(this);
        this.delete = this.delete.bind(this);
        this.deleteAll = this.deleteAll.bind(this);
        this.searchByName = this.searchByName.bind(this);
        this.getInRadius = this.getInRadius.bind(this);
        this.getStatistics = this.getStatistics.bind(this);
        this.count = this.count.bind(this);
        this.exists = this.exists.bind(this);
        this.codeExists = this.codeExists.bind(this);
    }

    /**
     * Crée une nouvelle zone
     * POST /zones
     */
    async create(req, res, next) {
        try {
            const { code, nom, population, superficie_km2, latitude, longitude } = req.body;

            // Validation des champs requis
            if (!code || !nom || population == null || superficie_km2 == null || latitude == null || longitude == null) {
                return res.status(400).json({
                    message: 'Champs requis manquants: code, nom, population, superficie_km2, latitude, longitude'
                });
            }

            const zone = await this.service.createZone(req.body);
            return res.status(201).json(zone);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Récupère toutes les zones avec pagination
     * GET /zones?page=1&limit=10
     */
    async getAll(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            if (page < 1 || limit < 1) {
                return res.status(400).json({ message: 'Page et limit doivent être positifs' });
            }

            const result = await this.service.getAllZones(page, limit);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Récupère une zone par ID
     * GET /zones/:id
     */
    async getById(req, res, next) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ message: 'ID est requis' });
            }

            const zone = await this.service.getZoneById(id);
            return res.status(200).json(zone);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Récupère une zone par son code
     * GET /zones/code/:code
     */
    async getByCode(req, res, next) {
        try {
            const { code } = req.params;

            if (!code) {
                return res.status(400).json({ message: 'Code est requis' });
            }

            const zone = await this.service.getZoneByCode(code);
            return res.status(200).json(zone);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Met à jour une zone
     * PATCH /zones/:id
     */
    async update(req, res, next) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ message: 'ID est requis' });
            }

            const zone = await this.service.updateZone(id, req.body);
            return res.status(200).json(zone);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Supprime une zone
     * DELETE /zones/:id
     */
    async delete(req, res, next) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ message: 'ID est requis' });
            }

            const zone = await this.service.deleteZone(id);
            return res.status(200).json({ message: 'Zone supprimée avec succès', data: zone });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Supprime toutes les zones
     * DELETE /zones
     */
    async deleteAll(req, res, next) {
        try {
            const zones = await this.service.deleteAllZones();
            return res.status(200).json({ 
                message: `${zones.length} zone(s) supprimée(s) avec succès`,
                data: zones 
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Recherche les zones par nom
     * GET /zones/search?nom=paris
     */
    async searchByName(req, res, next) {
        try {
            const { nom } = req.query;

            if (!nom) {
                return res.status(400).json({ message: 'Le paramètre "nom" est requis' });
            }

            const zones = await this.service.searchZonesByName(nom);
            return res.status(200).json({
                message: `${zones.length} zone(s) trouvée(s)`,
                data: zones
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Récupère les zones dans un rayon
     * GET /zones/radius?latitude=48.8566&longitude=2.3522&rayon=10
     */
    async getInRadius(req, res, next) {
        try {
            const { latitude, longitude, rayon } = req.query;

            if (!latitude || !longitude || !rayon) {
                return res.status(400).json({ 
                    message: 'Paramètres requis: latitude, longitude, rayon' 
                });
            }

            const lat = parseFloat(latitude);
            const lng = parseFloat(longitude);
            const radiusKm = parseFloat(rayon);

            if (isNaN(lat) || isNaN(lng) || isNaN(radiusKm)) {
                return res.status(400).json({ 
                    message: 'Latitude, longitude et rayon doivent être des nombres' 
                });
            }

            const zones = await this.service.getZonesInRadius(lat, lng, radiusKm);
            return res.status(200).json({
                message: `${zones.length} zone(s) trouvée(s) dans un rayon de ${radiusKm} km`,
                data: zones
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Récupère les statistiques des zones
     * GET /zones/stats/global
     */
    async getStatistics(req, res, next) {
        try {
            const stats = await this.service.getZoneStatistics();
            return res.status(200).json({
                message: 'Statistiques récupérées avec succès',
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Compte le nombre de zones
     * GET /zones/count
     */
    async count(req, res, next) {
        try {
            const result = await this.service.countZones();
            return res.status(200).json({
                message: 'Nombre de zones compté',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Vérifie si une zone existe
     * GET /zones/check/exists/:id
     */
    async exists(req, res, next) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ message: 'ID est requis' });
            }

            const result = await this.service.zoneExists(id);
            return res.status(200).json({
                message: result ? 'Zone trouvée' : 'Zone non trouvée',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Vérifie si un code de zone existe
     * GET /zones/check/code/:code
     */
    async codeExists(req, res, next) {
        try {
            const { code } = req.params;

            if (!code) {
                return res.status(400).json({ message: 'Code est requis' });
            }

            const result = await this.service.codeExists(code);
            return res.status(200).json({
                message: result ? 'Code trouvé' : 'Code non trouvé',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ZoneController;
