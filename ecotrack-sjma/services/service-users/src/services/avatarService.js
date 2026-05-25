import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { AvatarRepository } from '../repositories/avatar.repository.js';
import cacheService from './cacheService.js';
import logger from '../utils/logger.js';

const AVATARS_DIR = 'storage/avatars';
const ORIGINAL_DIR = path.join(AVATARS_DIR, 'original');
const THUMBNAILS_DIR = path.join(AVATARS_DIR, 'thumbnails');
const MINI_DIR = path.join(AVATARS_DIR, 'mini');

const ALLOWED_AVATAR_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

function assertWithinDir(resolvedPath, baseDir) {
  const base = path.resolve(baseDir);
  if (!resolvedPath.startsWith(base + path.sep) && resolvedPath !== base) {
    throw new Error('Path traversal detected');
  }
}

/**
 * Traiter et redimensionner l'avatar
 */
export const processAvatar = async (userId, tempFile) => {
  try {
    const tempPath = tempFile.path;
    // Extract extension from the basename only, never from a path with separators
    const safeName = path.basename(String(tempFile.filename || ''));
    const rawExt = path.extname(safeName).toLowerCase();

    if (!ALLOWED_AVATAR_EXTENSIONS.has(rawExt)) {
      await fs.unlink(tempPath).catch(() => {});
      throw new Error(`File extension not allowed: ${rawExt}`);
    }

    const fileExt = rawExt;
    const safeUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '');
    const baseFilename = `${safeUserId}${fileExt}`;

    // Créer les répertoires s'ils n'existent pas
    await ensureDirectories();

    // Chemins de stockage (vérification de containment)
    const originalPath = path.resolve(ORIGINAL_DIR, baseFilename);
    const thumbnailPath = path.resolve(THUMBNAILS_DIR, baseFilename);
    const miniPath = path.resolve(MINI_DIR, baseFilename);
    assertWithinDir(originalPath, ORIGINAL_DIR);
    assertWithinDir(thumbnailPath, THUMBNAILS_DIR);
    assertWithinDir(miniPath, MINI_DIR);

    // safeOriginalPath / safeMiniPath are validated strings — use them for I/O
    const safeOriginalPath = originalPath;
    const safeThumbnailPath = thumbnailPath;
    const safeMiniPath = miniPath;

    // 1. Redimensionner et stocker l'original (1000x1000)
    await sharp(tempPath)
      .resize(1000, 1000, {
        fit: 'cover',
        position: 'center'
      })
      .toFile(safeOriginalPath);

    // 2. Créer la thumbnail (200x200)
    await sharp(tempPath)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center'
      })
      .toFile(safeThumbnailPath);

    // 3. Créer la mini (64x64)
    await sharp(tempPath)
      .resize(64, 64, {
        fit: 'cover',
        position: 'center'
      })
      .toFile(safeMiniPath);

    // 4. Supprimer le fichier temporaire
    await fs.unlink(tempPath);

    // 5. Récupérer les URLs (baseFilename est composé de safeUserId + fileExt validé)
    const urls = {
      original: `/avatars/original/${baseFilename}`,
      thumbnail: `/avatars/thumbnails/${baseFilename}`,
      mini: `/avatars/mini/${baseFilename}`
    };

    return urls;
  } catch (error) {
    // Nettoyer en cas d'erreur
    await fs.unlink(tempFile.path).catch(() => {});
    throw error;
  }
};

/**
 * Sauvegarder les URLs avatars en base de données
 */
export const saveAvatarUrls = async (userId, urls) => {
  const user = await AvatarRepository.saveAvatarUrls(userId, urls);
  if (!user) {
    throw new Error('User not found');
  }
  // Invalider le cache du profil pour que /users/profile renvoie le nouvel avatar
  try {
    await cacheService.del(`user:${userId}:profile`);
  } catch (err) {
    logger.warn({ err: err.message, userId }, 'Could not invalidate profile cache');
  }
  return user;
};


/**
 * Supprimer les anciens avatars
 */
export const deleteOldAvatars = async (userId) => {
  try {
    const basePattern = `${userId}.`;
    
    // Supprimer original
    const originalFiles = await fs.readdir(ORIGINAL_DIR);
    const originalToDelete = originalFiles.filter(f => f.startsWith(`${userId}.`));
    
    for (const file of originalToDelete) {
      await fs.unlink(path.join(ORIGINAL_DIR, file));
    }

    // Supprimer thumbnail
    const thumbFiles = await fs.readdir(THUMBNAILS_DIR);
    const thumbToDelete = thumbFiles.filter(f => f.startsWith(`${userId}.`));
    
    for (const file of thumbToDelete) {
      await fs.unlink(path.join(THUMBNAILS_DIR, file));
    }

    // Supprimer mini
    const miniFiles = await fs.readdir(MINI_DIR);
    const miniToDelete = miniFiles.filter(f => f.startsWith(`${userId}.`));
    
    for (const file of miniToDelete) {
      await fs.unlink(path.join(MINI_DIR, file));
    }
  } catch (error) {
    logger.error({ error }, 'Error deleting old avatars');
  }
};

/**
 * Obtenir l'avatar d'un utilisateur
 */
export const getUserAvatar = async (userId) => {
  const avatar = await AvatarRepository.getUserAvatar(userId);
  if (!avatar) {
    throw new Error('User not found');
  }
  return avatar;
};


/**
 * Assurer que les répertoires existent
 */
async function ensureDirectories() {
  const dirs = [ORIGINAL_DIR, THUMBNAILS_DIR, MINI_DIR];
  
  for (const dir of dirs) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }
}