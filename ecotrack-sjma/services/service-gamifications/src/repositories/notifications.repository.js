// Rôle du fichier : accès aux données de notifications de gamification.
import pool from '../config/database.js';

export class NotificationsRepository {
  static async creerNotification({ idUtilisateur, type, titre, corps }, client = pool) {
    const { rows } = await client.query(
      `INSERT INTO notification (id_utilisateur, type, titre, corps)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [idUtilisateur, type, titre, corps]
    );
    return rows[0];
  }

  static async listerNotifications({ idUtilisateur, page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM notification WHERE id_utilisateur = $1',
      [idUtilisateur]
    );
    const total = parseInt(countResult.rows[0].count);
    
    const { rows } = await pool.query(
      `SELECT *
       FROM notification
       WHERE id_utilisateur = $1
       ORDER BY date_creation DESC
       LIMIT $2 OFFSET $3`,
      [idUtilisateur, limit, offset]
    );
    
    return { rows, total };
  }
}
