// Rôle du fichier : accès aux données pour les badges (repository pattern)
import pool from '../config/database.js';

export const BADGE_SEUILS = {
  DEBUTANT: 100,
  ECO_GUERRIER: 500,
  SUPER_HEROS: 1000
};

export const BadgeRepository = {
  async getAllBadges() {
    const { rows } = await pool.query(
      'SELECT id_badge, code, nom, description FROM badge ORDER BY nom'
    );
    return rows;
  },

  async getUserBadges(idUtilisateur) {
    const { rows } = await pool.query(
      `SELECT b.id_badge, b.code, b.nom, b.description, bu.date_obtention
       FROM user_badge bu
       JOIN badge b ON b.id_badge = bu.id_badge
       WHERE bu.id_utilisateur = $1
       ORDER BY bu.date_obtention DESC`,
      [idUtilisateur]
    );
    return rows;
  },

  async getKnownBadges(codes, client = pool) {
    const { rows } = await client.query(
      `SELECT id_badge, code, nom
       FROM badge
       WHERE code = ANY($1)`,
      [codes]
    );
    return rows;
  },

  async getUserBadgeIds(idUtilisateur, client = pool) {
    const { rows } = await client.query(
      'SELECT id_badge FROM user_badge WHERE id_utilisateur = $1',
      [idUtilisateur]
    );
    return rows.map((badge) => badge.id_badge);
  },

  async insertUserBadge(idUtilisateur, idBadge, client = pool) {
    const { rows } = await client.query(
      'INSERT INTO user_badge (id_utilisateur, id_badge) VALUES ($1, $2) RETURNING id_badge',
      [idUtilisateur, idBadge]
    );
    return rows[0];
  }
};
