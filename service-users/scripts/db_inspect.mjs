import pool from '../src/config/database.js';

/**
 * Script d'inspection de la base de données.
 * Usage: node db_inspect.mjs [table_name]
 * Si table_name est fourni, affiche les colonnes de cette table.
 * Sinon, affiche les colonnes de la table 'utilisateur' par défaut.
 */
const main = async () => {
  try {
    const table = process.argv[2] || 'utilisateur';
    const columns = await pool.query(
      `SELECT column_name, data_type, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_name = $1
       ORDER BY ordinal_position`,
      [table]
    );

    console.log(`TABLE: ${table}`);
    console.table(columns.rows);
  } finally {
    await pool.end();
  }
};

main().catch((err) => {
  console.error('DB_INSPECT_FAILED', err.code, err.message);
  process.exitCode = 1;
});
