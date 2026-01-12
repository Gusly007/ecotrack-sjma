import { asyncHandler } from '../middleware/errorHandler.js';
import * as userService from '../services/userService.js';

const extractUserId = (req) => {
  const rawId = req.user?.id ?? req.user?.userId ?? req.user?.id_utilisateur;
  if (rawId === undefined || rawId === null) {
    return null;
  }
  const parsed = Number(rawId);
  return Number.isNaN(parsed) ? null : parsed;
};

export const getOwnProfile = asyncHandler(async (req, res) => {
  const userId = extractUserId(req);
  if (userId === null) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const data = await userService.getUserProfile(userId);
  res.json({ data });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const userId = extractUserId(req);
  if (userId === null) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const updated = await userService.updateProfile(userId, req.body || {});
  res.json({ message: 'Profile updated successfully', data: updated });
});

export const changePassword = asyncHandler(async (req, res) => {
  const userId = extractUserId(req);
  if (userId === null) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { oldPassword, newPassword } = req.body || {};
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Champs manquants' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  const result = await userService.changePassword(userId, oldPassword, newPassword);
  res.json(result);
});

export const getProfileWithStats = asyncHandler(async (req, res) => {
  const userId = extractUserId(req);
  if (userId === null) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const data = await userService.getProfileWithStats(userId);
  res.json({ data });
});

export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, role, search } = req.query;
  const result = await userService.listUsers({ page, limit, role, search });
  res.json(result);
});

export const getUserProfile = asyncHandler(async (req, res) => {
  const targetId = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(targetId)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }
  const data = await userService.getProfileWithStats(targetId);
  res.json({ data });
});

export const updateUserByAdmin = asyncHandler(async (req, res) => {
  const targetId = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(targetId)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }
  const updated = await userService.updateUserByAdmin(targetId, req.body || {});
  res.json({ message: 'User updated successfully', data: updated });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const targetId = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(targetId)) {
    return res.status(400).json({ error: 'Invalid user id' });
  }
  await userService.deleteUser(targetId);
  res.json({ message: 'User deleted successfully' });
});
