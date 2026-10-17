/**
 * Construit la configuration PostgreSQL du service Containers.
 *
 * - Si DATABASE_URL est présent, on l'utilise en priorité pour Neon / Cloud Run.
 * - Sinon on retombe sur les variables PG* pour le dev local.
 */
function parseDatabaseUrl(databaseUrl) {
  if (!databaseUrl) {
    return {};
  }

  try {
    const parsedUrl = new URL(databaseUrl);
    const database = parsedUrl.pathname.replace(/^\/+/, '');

    return {
      host: parsedUrl.hostname,
      port: Number(parsedUrl.port) || 5432,
      user: decodeURIComponent(parsedUrl.username || ''),
      password: decodeURIComponent(parsedUrl.password || ''),
      database: database || 'ecotrack',
      ssl: { rejectUnauthorized: false },
    };
  } catch (_) {
    return {};
  }
}

function createDatabaseConfig(defaults = {}) {
  const databaseUrl = process.env.DATABASE_URL || null;
  const parsedUrl = parseDatabaseUrl(databaseUrl);
  const usingUrl = !!databaseUrl;

  return {
    connectionString: databaseUrl || undefined,
    host: (usingUrl ? parsedUrl.host : (process.env.PGHOST || parsedUrl.host)) || defaults.host || 'localhost',
    port: (usingUrl ? parsedUrl.port : (Number(process.env.PGPORT) || parsedUrl.port)) || defaults.port || 5432,
    user: (usingUrl ? parsedUrl.user : (process.env.PGUSER || parsedUrl.user)) || defaults.user || 'postgres',
    password: usingUrl
      ? (parsedUrl.password || defaults.password || '')
      : (process.env.PGPASSWORD !== undefined
          ? String(process.env.PGPASSWORD)
          : (parsedUrl.password || defaults.password || '')),
    database: (usingUrl ? parsedUrl.database : (process.env.PGDATABASE || parsedUrl.database)) || defaults.database || 'ecotrack',
    ssl: databaseUrl ? { rejectUnauthorized: false } : false,
    max: defaults.max || 10,
    idleTimeoutMillis: defaults.idleTimeoutMillis || 30000,
    connectionTimeoutMillis: defaults.connectionTimeoutMillis,
  };
}

module.exports = {
  createDatabaseConfig,
};