import * as roleService from '../services/roleService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const getUserRoles = asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.id);
  const roles = await roleService.getUserRoles(userId);
  res.json({ data: roles });
});

export const assignRole = asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.id);
  const { roleId } = req.body;

  if (!roleId) {
    return res.status(400).json({ error: 'roleId requis' });
  }

  const result = await roleService.assignRoleToUser(userId, roleId);
  res.status(201).json({ message: 'Role assigné', data: result });
});

export const removeRole = asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.id);
  const roleId = parseInt(req.params.roleId);

  await roleService.removeRoleFromUser(userId, roleId);
  res.json({ message: 'Role retiré' });
});