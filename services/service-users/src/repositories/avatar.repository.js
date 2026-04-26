// Repository: accès aux données avatar utilisateur
import pool from '../config/database.js';

export const AvatarRepository = {
  async saveAvatarUrls(userId, urls) {
    const result = await pool.query(
      `UPDATE UTILISATEUR 
       SET avatar_url = $1, avatar_thumbnail = $2, avatar_mini = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id_utilisateur = $1
       RETURNING id_utilisateur, avatar_url, avatar_thumbnail, avatar_mini`,
      [userId, urls.original, urls.thumbnail, urls.mini]
    );
    return result.rows[0];
  },
  async getUserAvatar(userId) {
    const result = await pool.query(
      'SELECT avatar_url, avatar_thumbnail, avatar_mini FROM UTILISATEUR WHERE id_utilisateur = $1',
      [userId]
    );
    return result.rows[0];
  }
};
