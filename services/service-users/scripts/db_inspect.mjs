import pool from '../src/config/database.js';
import logger from '../src/utils/logger.js';

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

    logger.info({ table }, 'DB inspect table');
    logger.info({ columns: columns.rows }, 'DB inspect columns');
  } finally {
    await pool.end();
  }
};

main().catch((err) => {
  logger.error({ code: err.code, message: err.message }, 'DB inspect failed');
  process.exitCode = 1;
});
