import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRole } from '../middleware/auth.js';
import { ConfigurationRepository } from '../repositories/configuration.repository.js';
import env from '../config/env.js';

const router = express.Router();

router.get('/',
    authenticateToken,
    authorizeRole(['ADMIN', 'GESTIONNAIRE']),
    async (req, res) => {
        try {
            const config = await ConfigurationRepository.getAll();
            const formatted = {};
            config.forEach(row => {
                let value;
                switch (row.type) {
                    case 'number':
                        value = parseFloat(row.valeur);
                        break;
                    case 'boolean':
                        value = row.valeur === 'true';
                        break;
                    case 'json':
                        try {
                            value = JSON.parse(row.valeur);
                        } catch {
                            value = row.valeur;
                        }
                        break;
                    default:
                        value = row.valeur;
                }
                formatted[row.cle] = {
                    value,
                    type: row.type,
                    description: row.description,
                    categorie: row.categorie,
                    modifiable: row.est_modifiable,
                    updatedAt: row.updated_at
                };
            });
            res.json(formatted);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

router.get('/category/:category',
    authenticateToken,
    authorizeRole(['ADMIN', 'GESTIONNAIRE']),
    async (req, res) => {
        try {
            const config = await ConfigurationRepository.getByCategory(req.params.category);
            const formatted = {};
            config.forEach(row => {
                let value;
                switch (row.type) {
                    case 'number':
                        value = parseFloat(row.valeur);
                        break;
                    case 'boolean':
                        value = row.valeur === 'true';
                        break;
                    case 'json':
                        try {
                            value = JSON.parse(row.valeur);
                        } catch {
                            value = row.valeur;
                        }
                        break;
                    default:
                        value = row.valeur;
                }
                formatted[row.cle] = { value, type: row.type, description: row.description, modifiable: row.est_modifiable };
            });
            res.json(formatted);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

router.get('/:key',
    authenticateToken,
    authorizeRole(['ADMIN', 'GESTIONNAIRE']),
    async (req, res) => {
        try {
            const config = await ConfigurationRepository.getByKey(req.params.key);
            if (!config) {
                return res.status(404).json({ error: 'Configuration non trouvée' });
            }
            let value;
            switch (config.type) {
                case 'number':
                    value = parseFloat(config.valeur);
                    break;
                case 'boolean':
                    value = config.valeur === 'true';
                    break;
                case 'json':
                    try {
                        value = JSON.parse(config.valeur);
                    } catch {
                        value = config.valeur;
                    }
                    break;
                default:
                    value = config.valeur;
            }
            res.json({
                key: config.cle,
                value,
                type: config.type,
                description: config.description,
                categorie: config.categorie,
                modifiable: config.est_modifiable,
                updatedAt: config.updated_at
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

router.put('/:key',
    authenticateToken,
    authorizeRole(['ADMIN']),
    async (req, res) => {
        try {
            const { key } = req.params;
            const { value, description } = req.body;

            if (value === undefined) {
                return res.status(400).json({ error: 'value est requis' });
            }

            const existing = await ConfigurationRepository.getByKey(key);
            if (!existing) {
                return res.status(404).json({ error: 'Configuration non trouvée' });
            }
            if (!existing.est_modifiable) {
                return res.status(403).json({ error: 'Cette configuration ne peut pas être modifiée' });
            }

            let finalValue = value;
            if (existing.type === 'number') {
                finalValue = parseFloat(value);
                if (isNaN(finalValue)) {
                    return res.status(400).json({ error: 'La valeur doit être un nombre' });
                }
                if (existing.min_valeur !== null && finalValue < existing.min_valeur) {
                    return res.status(400).json({ error: `La valeur minimale est ${existing.min_valeur}` });
                }
                if (existing.max_valeur !== null && finalValue > existing.max_valeur) {
                    return res.status(400).json({ error: `La valeur maximale est ${existing.max_valeur}` });
                }
            } else if (existing.type === 'boolean') {
                if (typeof value !== 'boolean' && !['true', 'false'].includes(value)) {
                    return res.status(400).json({ error: 'La valeur doit être true ou false' });
                }
                finalValue = String(value);
            } else if (existing.type === 'json') {
                if (typeof value !== 'object') {
                    return res.status(400).json({ error: 'La valeur doit être un objet JSON' });
                }
                finalValue = JSON.stringify(value);
            }

            await ConfigurationRepository.update(key, { valeur: finalValue, description });

            await env.refreshDbConfig();

            res.json({
                success: true,
                message: `Configuration '${key}' mise à jour`,
                key,
                value: existing.type === 'json' ? JSON.parse(finalValue) : (existing.type === 'number' ? finalValue : (existing.type === 'boolean' ? finalValue === 'true' : finalValue))
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

export default router;
