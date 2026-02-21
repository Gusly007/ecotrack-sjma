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

  static async listerNotifications({ idUtilisateur }) {
    const { rows } = await pool.query(
      `SELECT *
       FROM notification
       WHERE id_utilisateur = $1
       ORDER BY date_creation DESC`,
      [idUtilisateur]
    );
    return rows;
  }
}
