import { asyncHandler } from '../middleware/errorHandler.js';
import * as authService from '../services/authService.js';
import * as userService from '../services/userService.js';

/**
 * POST /auth/registre  
 */

export const register = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Champs manquants' });
  }

  const result = await authService.registerUser(email, username, password, role);

  res.status(201).json({
    message: 'Registration reussie',
    token: result.accessToken,
    refreshToken: result.refreshToken,
    user: result.user
  });
});

/**
 * POST /auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Champs manquants' });
  }

  const result = await authService.loginUser(email, password, req.ip);

  res.json({
    message: 'Login successful',
    token: result.accessToken,
    refreshToken: result.refreshToken,
    user: result.user
  });
});

/**
 * GET /auth/profile
 */
export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const user = await authService.getUserById(userId);
  res.json({ data: user });
});

/**
 * PUT /users/profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const updated = await userService.updateProfile(userId, req.body);
  res.json({ message: 'Profile updated', data: updated });
});

/**
 * POST /users/change-password
 */
export const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Champs manquants' });
  }

  const result = await userService.changePassword(userId, oldPassword, newPassword);
  res.json(result);
});

/**
 * GET /users/profile-with-stats
 */
export const getProfileWithStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const user = await userService.getProfileWithStats(userId);
  res.json({ data: user });
});