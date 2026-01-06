import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import pool from '../config/database.js';

const AVATARS_DIR = 'storage/avatars';
const ORIGINAL_DIR = path.join(AVATARS_DIR, 'original');
const THUMBNAILS_DIR = path.join(AVATARS_DIR, 'thumbnails');
const MINI_DIR = path.join(AVATARS_DIR, 'mini');

/**
 * Traiter et redimensionner l'avatar
 */
export const processAvatar = async (userId, tempFile) => {
  try {
    const tempPath = tempFile.path;
    const fileExt = path.extname(tempFile.filename).toLowerCase();
    const baseFilename = `${userId}${fileExt}`;

    // Créer les répertoires s'ils n'existent pas
    await ensureDirectories();

    // Chemins de stockage
    const originalPath = path.join(ORIGINAL_DIR, baseFilename);
    const thumbnailPath = path.join(THUMBNAILS_DIR, baseFilename);
    const miniPath = path.join(MINI_DIR, baseFilename);

    // 1. Redimensionner et stocker l'original (1000x1000)
    await sharp(tempPath)
      .resize(1000, 1000, {
        fit: 'cover',
        position: 'center'
      })
      .toFile(originalPath);

    // 2. Créer la thumbnail (200x200)
    await sharp(tempPath)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center'
      })
      .toFile(thumbnailPath);

    // 3. Créer la mini (64x64)
    await sharp(tempPath)
      .resize(64, 64, {
        fit: 'cover',
        position: 'center'
      })
      .toFile(miniPath);

    // 4. Supprimer le fichier temporaire
    await fs.unlink(tempPath);

    // 5. Récupérer les URLs
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
  const result = await pool.query(
    `UPDATE UTILISATEUR 
     SET avatar_url = $1, avatar_thumbnail = $2, avatar_mini = $3, updated_at = CURRENT_TIMESTAMP
     WHERE id_utilisateur = $1
     RETURNING id_utilisateur, avatar_url, avatar_thumbnail, avatar_mini`,
    [userId, urls.original, urls.thumbnail, urls.mini]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  return result.rows[0];
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
    console.error('Error deleting old avatars:', error);
  }
};

/**
 * Obtenir l'avatar d'un utilisateur
 */
export const getUserAvatar = async (userId) => {
  const result = await pool.query(
    'SELECT avatar_url, avatar_thumbnail, avatar_mini FROM UTILISATEUR WHERE id_utilisateur = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  return result.rows[0];
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