import pool, { initGamificationDb } from '../../src/config/database.js';

export const prepareDatabase = async () => {
  await initGamificationDb();
};

export const resetDatabase = async () => {
  try {
    await pool.query(
      `TRUNCATE gamification_participation_defi,
        gamification_defi,
        user_badge,
        notification,
        historique_points,
        utilisateur
       RESTART IDENTITY CASCADE`
    );
  } catch (err) {
    // Ignore truncate errors (tables might not exist yet)
    if (!err.message.includes('does not exist')) {
      throw err;
    }
  }

  // Insert users with ON CONFLICT to handle race conditions
  await pool.query(
    `INSERT INTO utilisateur (id_utilisateur, points)
     VALUES (1, 0), (2, 0), (3, 0)
     ON CONFLICT (id_utilisateur) DO UPDATE SET points = EXCLUDED.points`
  );
};

export const closeDatabase = async () => {
  await pool.end();
};

export const seedHistoriquePoints = async ({ idUtilisateur, entries }) => {
  const values = entries
    .map(
      (_, index) =>
        `($${index * 3 + 1}, $${index * 3 + 2}, $${index * 3 + 3})`
    )
    .join(', ');

  const params = entries.flatMap((entry) => [
    idUtilisateur,
    entry.points,
    entry.date
  ]);

  await pool.query(
    `INSERT INTO historique_points (id_utilisateur, delta_points, date_creation)
     VALUES ${values}`,
    params
  );
};

export default pool;
