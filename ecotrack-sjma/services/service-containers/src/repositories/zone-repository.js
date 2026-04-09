/**
 * Zone Repository - Data Access Layer
 * Handles all database queries for zones
 */
const CodeGenerator = require('../utils/code-generator');

class ZoneRepository {
    constructor(db) {
        this.db = db;
    }

    /**
     * Crée une nouvelle zone
     * @param {Object} zoneData - Données de zone
     * @param {string} [zoneData.code] - Code unique de la zone (auto-généré si non fourni)
     * @param {string} zoneData.nom - Nom de la zone
     * @param {number} zoneData.population - Population (entier >= 0)
     * @param {number} zoneData.superficie_km2 - Superficie en km² (>= 0)
     * @param {number} zoneData.latitude - Latitude entre -90 et 90
     * @param {number} zoneData.longitude - Longitude entre -180 et 180
     * @param {string} [zoneData.couleur] - Couleur de la zone (hex)
     * @param {string} [zoneData.geometry] - Géométrie GeoJSON pour formes dessinées
     */
    async addZone(zoneData) {
        const { code, nom, population, superficie_km2, latitude, longitude, couleur, geometry } = zoneData;
        
        // Validation des champs requis
        if (!nom || population === undefined || superficie_km2 === undefined) {
            throw new Error('Tous les champs requis manquent: nom, population, superficie_km2');
        }

        // Générer un code unique si non fourni
        const zoneCode = code || await CodeGenerator.generateUnique(this.db, 'zone', 'code', 'ZN', 6);

        // Validation du code (unique) - seulement si fourni manuellement
        if (code) {
            const existingCode = await this.db.query(
                'SELECT id_zone FROM zone WHERE code = $1',
                [code]
            );
            if (existingCode.rows.length > 0) {
                throw new Error(`Le code de zone "${code}" existe déjà`);
            }
        }

        // Validation des valeurs numériques
        if (population < 0 || superficie_km2 < 0) {
            throw new Error('La population et la superficie doivent être positives');
        }

        let result;
        if (geometry) {
            result = await this.db.query(
                `INSERT INTO zone (code, nom, population, superficie_km2, couleur, geom)
                 VALUES ($1, $2, $3, $4, $5, ST_GeomFromGeoJSON($6))
                 RETURNING id_zone, code, nom, population, superficie_km2, couleur,
                           ST_X(ST_Centroid(geom)) as longitude,
                           ST_Y(ST_Centroid(geom)) as latitude`,
                [zoneCode, nom, population, superficie_km2, couleur || '#3388ff', geometry]
            );
        } else {
            if (latitude === undefined || longitude === undefined) {
                throw new Error('Coordonnées GPS requises sans géométrie personnalisée');
            }
            if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
                throw new Error('Coordonnées GPS invalides (latitude: -90 à 90, longitude: -180 à 180)');
            }

            const radiusKm = Math.sqrt(superficie_km2 / Math.PI);
            const radiusMeters = radiusKm * 1000;

            result = await this.db.query(
                `INSERT INTO zone (code, nom, population, superficie_km2, couleur, geom)
                 VALUES ($1, $2, $3, $4, $5,
                         ST_Buffer(
                             ST_SetSRID(ST_MakePoint($6, $7), 4326)::geography,
                             $8
                         )::geometry
                 )
                 RETURNING id_zone, code, nom, population, superficie_km2, couleur,
                           ST_X(ST_Centroid(geom)) as longitude,
                           ST_Y(ST_Centroid(geom)) as latitude`,
                [zoneCode, nom, population, superficie_km2, couleur || '#3388ff', longitude, latitude, radiusMeters]
            );
        }
        
        return result.rows[0];
    }

    /**
     * Récupère toutes les zones avec pagination
     */
    async getAllZones(page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        
        const result = await this.db.query(
                `SELECT id_zone, code, nom, population, superficie_km2, couleur,
                    ST_X(ST_Centroid(geom)) as longitude,
                    ST_Y(ST_Centroid(geom)) as latitude,
                    ST_AsGeoJSON(geom)::json as geometry
                 FROM zone 
             ORDER BY nom ASC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        // Récupérer le nombre total de zones
        const countResult = await this.db.query('SELECT COUNT(*) FROM zone');
        const total = parseInt(countResult.rows[0].count);

        return {
            data: result.rows,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Récupère une zone par ID
     */
    async getZoneById(id) {
        if (!id) {
            throw new Error('ID de zone requis');
        }

        const result = await this.db.query(
                `SELECT id_zone, code, nom, population, superficie_km2, couleur,
                    ST_X(ST_Centroid(geom)) as longitude,
                    ST_Y(ST_Centroid(geom)) as latitude,
                    ST_AsGeoJSON(geom)::json as geometry
                 FROM zone 
             WHERE id_zone = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            throw new Error(`Zone avec l'ID ${id} non trouvée`);
        }

        return result.rows[0];
    }

    /**
     * Récupère une zone par son code
     */
    async getZoneByCode(code) {
        if (!code) {
            throw new Error('Code de zone requis');
        }

        const result = await this.db.query(
                `SELECT id_zone, code, nom, population, superficie_km2, couleur,
                    ST_X(ST_Centroid(geom)) as longitude,
                    ST_Y(ST_Centroid(geom)) as latitude,
                    ST_AsGeoJSON(geom)::json as geometry
                 FROM zone 
             WHERE code = $1`,
            [code]
        );

        if (result.rows.length === 0) {
            throw new Error(`Zone avec le code "${code}" non trouvée`);
        }

        return result.rows[0];
    }

    /**
     * Met à jour une zone
     * @param {number} id - ID de la zone
     * @param {Object} zoneData - Données à mettre à jour
     * @param {string} [zoneData.code] - Code unique de la zone
     * @param {string} [zoneData.nom] - Nom de la zone
     * @param {number} [zoneData.population] - Population (entier >= 0)
     * @param {number} [zoneData.superficie_km2] - Superficie en km² (>= 0)
     * @param {number} [zoneData.latitude] - Latitude entre -90 et 90
     * @param {number} [zoneData.longitude] - Longitude entre -180 et 180
     * @param {string} [zoneData.couleur] - Couleur de la zone (hex)
     * @param {string} [zoneData.geometry] - Géométrie GeoJSON pour formes dessinées
     */
    async updateZone(id, zoneData) {
        if (!id) {
            throw new Error('ID de zone requis');
        }

        const { code, nom, population, superficie_km2, latitude, longitude, couleur, geometry } = zoneData;

        // Vérifier que la zone existe
        const existing = await this.getZoneById(id);

        // Construire la requête dynamiquement
        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (code !== undefined) {
            // Vérifier que le code n'existe pas ailleurs
            const existingCode = await this.db.query(
                'SELECT id_zone FROM zone WHERE code = $1 AND id_zone != $2',
                [code, id]
            );
            if (existingCode.rows.length > 0) {
                throw new Error(`Le code de zone "${code}" existe déjà`);
            }
            updates.push(`code = $${paramIndex++}`);
            values.push(code);
        }

        if (nom !== undefined) {
            updates.push(`nom = $${paramIndex++}`);
            values.push(nom);
        }

        if (population !== undefined) {
            if (population < 0) {
                throw new Error('La population doit être positive');
            }
            updates.push(`population = $${paramIndex++}`);
            values.push(population);
        }

        if (superficie_km2 !== undefined) {
            if (superficie_km2 < 0) {
                throw new Error('La superficie doit être positive');
            }
            updates.push(`superficie_km2 = $${paramIndex++}`);
            values.push(superficie_km2);
        }

        if (couleur !== undefined) {
            updates.push(`couleur = $${paramIndex++}`);
            values.push(couleur);
        }

        // Mise à jour de la géométrie
        if (geometry) {
            updates.push(`geom = ST_GeomFromGeoJSON($${paramIndex++})`);
            values.push(geometry);
        } else if (latitude !== undefined && longitude !== undefined) {
            if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
                throw new Error('Coordonnées GPS invalides');
            }
            const currentArea = superficie_km2 !== undefined ? superficie_km2 : existing.superficie_km2;
            const radiusKm = Math.sqrt(currentArea / Math.PI);
            const radiusMeters = radiusKm * 1000;
            updates.push(`geom = ST_Buffer(ST_SetSRID(ST_MakePoint($${paramIndex++}, $${paramIndex++}), 4326)::geography, $${paramIndex++})::geometry`);
            values.push(longitude, latitude, radiusMeters);
        } else if (superficie_km2 !== undefined) {
            const radiusKm = Math.sqrt(superficie_km2 / Math.PI);
            const radiusMeters = radiusKm * 1000;
            updates.push(`geom = ST_Buffer(ST_Centroid(geom)::geography, $${paramIndex++})::geometry`);
            values.push(radiusMeters);
        }

        if (updates.length === 0) {
            throw new Error('Aucun champ à mettre à jour');
        }

        values.push(id);

        const result = await this.db.query(
            `UPDATE zone 
             SET ${updates.join(', ')} 
             WHERE id_zone = $${paramIndex} 
             RETURNING id_zone, code, nom, population, superficie_km2, couleur,
                       ST_X(ST_Centroid(geom)) as longitude,
                       ST_Y(ST_Centroid(geom)) as latitude,
                       ST_AsGeoJSON(geom)::json as geometry`,
            values
        );

        return result.rows[0];
    }

    /**
     * Supprime une zone
     */
    async deleteZone(id) {
        if (!id) {
            throw new Error('ID de zone requis');
        }

        // Vérifier que la zone existe
        await this.getZoneById(id);

        const result = await this.db.query(
            'DELETE FROM zone WHERE id_zone = $1 RETURNING *',
            [id]
        );

        return result.rows[0];
    }

    /**
     * Supprime toutes les zones
     */
    async deleteAllZones() {
        const result = await this.db.query('DELETE FROM zone RETURNING *');
        return result.rows;
    }

    /**
     * Recherche les zones par nom (recherche partielle)
     */
    async searchZonesByName(nom) {
        if (!nom || nom.trim().length === 0) {
            throw new Error('Le nom de zone requis pour la recherche');
        }

        const result = await this.db.query(
                `SELECT id_zone, code, nom, population, superficie_km2, couleur,
                    ST_X(ST_Centroid(geom)) as longitude,
                    ST_Y(ST_Centroid(geom)) as latitude,
                    ST_AsGeoJSON(geom)::json as geometry
                 FROM zone 
             WHERE nom ILIKE $1
             ORDER BY nom ASC`,
            [`%${nom}%`]
        );

        return result.rows;
    }

    /**
     * Récupère les zones dans un rayon spécifié
     */
    async getZonesInRadius(latitude, longitude, radiusKm) {
        if (latitude == null || longitude == null || radiusKm == null) {
            throw new Error('Latitude, longitude et rayon requis');
        }

        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            throw new Error('Coordonnées GPS invalides');
        }

        if (radiusKm <= 0) {
            throw new Error('Le rayon doit être positif');
        }

        const result = await this.db.query(
                `SELECT id_zone, code, nom, population, superficie_km2, couleur,
                    ST_X(ST_Centroid(geom)) as longitude,
                    ST_Y(ST_Centroid(geom)) as latitude,
                    ST_AsGeoJSON(geom)::json as geometry,
                    ST_Distance(ST_Centroid(geom)::geography, ST_MakePoint($1, $2)::geography) / 1000 as distance_km
                 FROM zone 
             WHERE ST_DWithin(geom::geography, ST_MakePoint($1, $2)::geography, $3 * 1000)
             ORDER BY distance_km ASC`,
            [longitude, latitude, radiusKm]
        );

        return result.rows;
    }

    /**
     * Récupère les statistiques des zones
     */
    async getZoneStatistics() {
        const result = await this.db.query(
            `SELECT 
                COUNT(*) as total_zones,
                SUM(population) as population_totale,
                SUM(superficie_km2) as superficie_totale_km2,
                AVG(population) as population_moyenne,
                AVG(superficie_km2) as superficie_moyenne_km2,
                MIN(population) as population_min,
                MAX(population) as population_max
             FROM zone`
        );

        return result.rows[0];
    }

    /**
     * Compte le nombre de zones
     */
    async countZones() {
        const result = await this.db.query('SELECT COUNT(*) FROM zone');
        return parseInt(result.rows[0].count);
    }

    /**
     * Vérifie si une zone existe
     */
    async zoneExists(id) {
        const result = await this.db.query(
            'SELECT id_zone FROM zone WHERE id_zone = $1',
            [id]
        );
        return result.rows.length > 0;
    }

    /**
     * Vérifie si un code de zone existe
     */
    async codeExists(code) {
        const result = await this.db.query(
            'SELECT id_zone FROM zone WHERE code = $1',
            [code]
        );
        return result.rows.length > 0;
    }
}

module.exports = ZoneRepository;
