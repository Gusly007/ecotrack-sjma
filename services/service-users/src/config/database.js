import pg from 'pg';
import env from './env.js';

const { Pool } = pg;

const pool = new Pool({
  connectionString: env.databaseUrl
});

pool.on('error', (err) => {
  console.error('Database error:', err);
});

pool.on('connect', () => {
  console.log('✓ Connected to PostgreSQL');
});

export const ensureAuthTables = async () => {
  // Some schemas were imported without auto-increment on UTILISATEUR.id_utilisateur.
  // If the column is not IDENTITY, ensure a sequence-backed DEFAULT exists so inserts can omit the id.
  try {
    const identity = await pool.query(
      "SELECT is_identity FROM information_schema.columns WHERE table_name = 'utilisateur' AND column_name = 'id_utilisateur'"
    );

    const isIdentity = identity.rows?.[0]?.is_identity === 'YES';
    if (!isIdentity) {
      await pool.query('CREATE SEQUENCE IF NOT EXISTS utilisateur_id_utilisateur_seq');
      await pool.query(
        "ALTER TABLE UTILISATEUR ALTER COLUMN id_utilisateur SET DEFAULT nextval('utilisateur_id_utilisateur_seq')"
      );
    }

    // Whether SERIAL or IDENTITY, ensure the underlying sequence is synced to MAX(id_utilisateur)
    // to avoid duplicate key violations on new inserts.
    const seqResult = await pool.query(
      "SELECT pg_get_serial_sequence('utilisateur', 'id_utilisateur') AS seq"
    );
    const seq = seqResult.rows?.[0]?.seq;
    if (seq) {
      await pool.query(
        "SELECT setval($1::regclass, COALESCE((SELECT MAX(id_utilisateur) FROM UTILISATEUR), 0))",
        [seq]
      );
    }
  } catch (_) {
    // best-effort only
  }

  // Minimal schema required for refresh-token sessions.
  await pool.query(
    `CREATE TABLE IF NOT EXISTS refresh_tokens (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL,
      token TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id)
        REFERENCES UTILISATEUR(id_utilisateur)
        ON DELETE CASCADE
    )`
  );

  await pool.query(
    'CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_token ON refresh_tokens(user_id, token)'
  );

  await pool.query(
    'CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_created_at ON refresh_tokens(user_id, created_at DESC)'
  );
};

export default pool;
