import * as sessionService from '../services/sessionService.js';
import * as authService from '../services/authService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { generateToken, verifyToken } from '../utils/jwt.js';

/**
 * POST /auth/refresh
 * Renouveler l'access token avec le refresh token
 */
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  try {
    const decoded = verifyToken(refreshToken);
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid refresh token');
    }

    // Vérifier si le token existe en DB
    const isValid = await sessionService.validateRefreshToken(decoded.id, refreshToken);

    if (!isValid) {
      throw new Error('Refresh token expired or revoked');
    }

    // Récupérer l'utilisateur
    const user = await authService.getUserById(decoded.id);

    // Générer nouvel access token
    const newAccessToken = generateToken(user.id_utilisateur, user.role_par_defaut);

    res.json({
      message: 'Token refreshed',
      token: newAccessToken
    });
  } catch (err) {
    return res.status(403).json({ error: err.message });
  }
});

/**
 * POST /auth/logout
 * Invalider le refresh token (logout)
 */
export const logout = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { refreshToken } = req.body;

  if (refreshToken) {
    await sessionService.invalidateRefreshToken(userId, refreshToken);
  }

  res.json({ message: 'Logged out successfully' });
});

/**
 * POST /auth/logout-all
 * Invalider tous les tokens (logout partout)
 */
export const logoutAll = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  await sessionService.invalidateAllTokens(userId);

  res.json({ message: 'Logged out from all devices' });
});