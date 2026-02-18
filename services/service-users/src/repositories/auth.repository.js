// Repository: accès aux données utilisateur pour l'authentification
import pool from '../config/database.js';

export const AuthRepository = {
  async findUserByEmailOrPrenom(email, prenom) {
    const result = await pool.query(
      'SELECT id_utilisateur FROM UTILISATEUR WHERE email = $1 OR prenom = $2',
      [email, prenom]
    );
    return result.rows;
  },
  async insertUser(email, prenom, hashedPassword, role) {
    const result = await pool.query(
      `INSERT INTO UTILISATEUR (email, nom, prenom, password_hash, role_par_defaut, est_active)
        VALUES ($1, $2, $3, $4, $5, true)
        RETURNING id_utilisateur, email, nom, prenom, role_par_defaut, points`,
      [email, prenom, prenom, hashedPassword, role]
    );
    return result.rows[0];
  },
  async findUserByEmail(email) {
    const result = await pool.query(
      'SELECT id_utilisateur, email, prenom, password_hash, role_par_defaut, points, est_active FROM UTILISATEUR WHERE email = $1',
      [email]
    );
    return result.rows[0];
  },
  async findUserById(userId) {
    const result = await pool.query(
      'SELECT id_utilisateur, email, prenom, role_par_defaut, points FROM UTILISATEUR WHERE id_utilisateur = $1',
      [userId]
    );
    return result.rows[0];
  }
};
