import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRole } from '../middleware/auth.js';
import { permissionsService } from '../services/permissionsService.js';

const router = express.Router();

router.get('/',
    authenticateToken,
    authorizeRole(['ADMIN']),
    async (req, res) => {
        try {
            const permissions = await permissionsService.getAllPermissions();
            res.json(permissions);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

router.get('/:role',
    authenticateToken,
    authorizeRole(['ADMIN']),
    async (req, res) => {
        try {
            const { role } = req.params;
            const permissions = await permissionsService.getRolePermissions(role);
            res.json({ role, permissions });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

router.put('/:role',
    authenticateToken,
    authorizeRole(['ADMIN']),
    async (req, res) => {
        try {
            const { role } = req.params;
            const { permissions } = req.body;
            
            if (!Array.isArray(permissions)) {
                return res.status(400).json({ error: 'permissions doit être un tableau' });
            }
            
            await permissionsService.updateRolePermissions(role, permissions);
            res.json({ success: true, message: `Permissions mises à jour pour ${role}` });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

router.post('/:role',
    authenticateToken,
    authorizeRole(['ADMIN']),
    async (req, res) => {
        try {
            const { role } = req.params;
            const { permission } = req.body;
            
            if (!permission) {
                return res.status(400).json({ error: 'permission est requise' });
            }
            
            await permissionsService.addPermission(role, permission);
            res.json({ success: true, message: `Permission ${permission} ajoutée à ${role}` });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

router.delete('/:role/:permission',
    authenticateToken,
    authorizeRole(['ADMIN']),
    async (req, res) => {
        try {
            const { role, permission } = req.params;
            
            await permissionsService.removePermission(role, permission);
            res.json({ success: true, message: `Permission ${permission} retirée de ${role}` });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);

export default router;
