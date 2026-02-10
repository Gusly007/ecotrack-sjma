// Rôle du fichier : création et lecture des notifications de gamification.
import pool from '../config/database.js';

// Crée une notification pour un utilisateur.
export const creerNotification = async ({ idUtilisateur, type, titre, corps }, client = pool) => {
  const { rows } = await client.query(
    // Insertion d'une notification simple.
    `INSERT INTO notification (id_utilisateur, type, titre, corps)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [idUtilisateur, type, titre, corps]
  );

  return rows[0];
};

// Liste les notifications d'un utilisateur, les plus récentes d'abord.
export const listerNotifications = async ({ idUtilisateur }) => {
  const { rows } = await pool.query(
    `SELECT *
     FROM notification
     WHERE id_utilisateur = $1
     ORDER BY date_creation DESC`,
    [idUtilisateur]
  );

  return rows;
};
