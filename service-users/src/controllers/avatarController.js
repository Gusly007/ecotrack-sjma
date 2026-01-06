import * as avatarService from '../services/avatarService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import fs from 'fs/promises';
import sharp from 'sharp';
import pool from '../config/database.js';


/**
 * POST /users/avatar/upload
 * Uploader un nouvel avatar
 */
export const uploadAvatar = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Valider les dimensions
  const { width, height } = await getImageDimensions(req.file.path);

  if (width < 100 || height < 100) {
    await fs.unlink(req.file.path);
    return res.status(400).json({ 
      error: 'Image must be at least 100x100 pixels' 
    });
  }

  // Supprimer les anciens avatars
  await avatarService.deleteOldAvatars(userId);

  // Traiter les images
  const urls = await avatarService.processAvatar(userId, req.file);

  // Sauvegarder en base de données
  const user = await avatarService.saveAvatarUrls(userId, urls);

  res.status(201).json({
    message: 'Avatar uploaded successfully',
    data: {
      id_utilisateur: user.id_utilisateur,
      avatar_url: user.avatar_url,
      avatar_thumbnail: user.avatar_thumbnail,
      avatar_mini: user.avatar_mini
    }
  });
});

/**
 * GET /users/avatar/:userId
 * Récupérer l'avatar d'un utilisateur
 */
export const getUserAvatar = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const avatar = await avatarService.getUserAvatar(parseInt(userId));

  res.json({ data: avatar });
});

/**
 * DELETE /users/avatar
 * Supprimer son avatar
 */
export const deleteAvatar = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Supprimer les fichiers
  await avatarService.deleteOldAvatars(userId);

  // Vider les URLs en base de données
  await pool.query(
    'UPDATE UTILISATEUR SET avatar_url = NULL, avatar_thumbnail = NULL, avatar_mini = NULL WHERE id_utilisateur = $1',
    [userId]
  );

  res.json({ message: 'Avatar deleted successfully' });
});

/**
 * Fonction helper pour obtenir les dimensions
 */
async function getImageDimensions(filePath) {
  try {
    const metadata = await sharp(filePath).metadata();
    return {
      width: metadata.width,
      height: metadata.height
    };
  } catch {
    throw new Error('Invalid image file');
  }
}