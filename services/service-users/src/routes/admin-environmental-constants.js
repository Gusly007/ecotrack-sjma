import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRole } from '../middleware/auth.js';
import { EnvironmentalConstantsRepository } from '../repositories/environmentalConstants.repository.js';

const router = express.Router();

router.get('/internal',
    async (req, res) => {
        try {
            const constants = await EnvironmentalConstantsRepository.getAll();
            const formatted = {};
            constants.forEach(row => {
                const value = row.type === 'number' ? parseFloat(row.valeur) : row.valeur;
                formatted[row.cle] = {
                    value,
                    unite: row.unite,
                    description: row.description,
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

router.get('/',
    authenticateToken,
    authorizeRole(['ADMIN', 'GESTIONNAIRE']),
    async (req, res) => {
        try {
            const constants = await EnvironmentalConstantsRepository.getAll();
            const formatted = {};
            constants.forEach(row => {
                const value = row.type === 'number' ? parseFloat(row.valeur) : row.valeur;
                formatted[row.cle] = {
                    value,
                    unite: row.unite,
                    description: row.description,
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

router.get('/:key',
    authenticateToken,
    authorizeRole(['ADMIN', 'GESTIONNAIRE']),
    async (req, res) => {
        try {
            const constant = await EnvironmentalConstantsRepository.getByKey(req.params.key);
            if (!constant) {
                return res.status(404).json({ error: 'Constante non trouvée' });
            }
            const value = constant.type === 'number' ? parseFloat(constant.valeur) : constant.valeur;
            res.json({
                key: constant.cle,
                value,
                unite: constant.unite,
                description: constant.description,
                modifiable: constant.est_modifiable,
                updatedAt: constant.updated_at
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
            const { value } = req.body;

            if (value === undefined) {
                return res.status(400).json({ error: 'value est requis' });
            }

            const existing = await EnvironmentalConstantsRepository.getByKey(key);
            if (!existing) {
                return res.status(404).json({ error: 'Constante non trouvée' });
            }
            if (!existing.est_modifiable) {
                return res.status(403).json({ error: 'Cette constante ne peut pas être modifiée' });
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
            }

            await EnvironmentalConstantsRepository.update(key, finalValue);

            res.json({
                success: true,
                message: `Constante '${key}' mise à jour`,
                key,
                value: finalValue,
                unite: existing.unite
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

export default router;
