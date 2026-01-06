import pool from '../config/database.js';

/**
 * Créer une notification
 */
export const createNotification = async (userId, title, message, type = 'SYSTEME') => {
  const result = await pool.query(
    `INSERT INTO NOTIFICATION (id_utilisateur, type, titre, corps, est_lu, date_creation)
     VALUES ($1, $2, $3, $4, false, CURRENT_TIMESTAMP)
     RETURNING *`,
    [userId, type, title, message]
  );

  return result.rows[0];
};

/**
 * Récupérer les notifications d'un utilisateur
 */
export const getUserNotifications = async (userId, limit = 50) => {
  const result = await pool.query(
    `SELECT * FROM NOTIFICATION
     WHERE id_utilisateur = $1
     ORDER BY date_creation DESC
     LIMIT $2`,
    [userId, limit]
  );

  return result.rows;
};

/**
 * Marquer une notification comme lue
 */
export const markAsRead = async (notificationId) => {
  const result = await pool.query(
    'UPDATE NOTIFICATION SET est_lu = true WHERE id_notification = $1 RETURNING *',
    [notificationId]
  );

  return result.rows[0];
};

/**
 * Compter les notifications non lues
 */
export const getUnreadCount = async (userId) => {
  const result = await pool.query(
    'SELECT COUNT(*) as count FROM NOTIFICATION WHERE id_utilisateur = $1 AND est_lu = false',
    [userId]
  );

  return parseInt(result.rows[0].count);
};

/**
 * Supprimer une notification
 */
export const deleteNotification = async (notificationId) => {
  await pool.query(
    'DELETE FROM NOTIFICATION WHERE id_notification = $1',
    [notificationId]
  );
};