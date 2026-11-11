// Rôle du fichier : accès aux données de notifications de gamification.
import pool from '../config/database.js';

// Same rule as TYPE_ROLE_MAP in service-notification; stored rows can contradict it.
const VISIBLE_TO_RECIPIENT = `(
  notification.type NOT IN ('BADGE', 'DEFI')
  OR EXISTS (
    SELECT 1 FROM utilisateur u
    WHERE u.id_utilisateur = notification.id_utilisateur
      AND u.role_par_defaut IN ('CITOYEN', 'AGENT')
  )
)`;

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
    const { rows } = await pool.query(
      `SELECT *
       FROM notification
       WHERE id_utilisateur = $1 AND ${VISIBLE_TO_RECIPIENT}
       ORDER BY date_creation DESC`,
      [idUtilisateur]
    );
    
    return rows;
  }
}
