const db = require('./connexion');

(async () => {
  const ok = await db.testConnection();
  process.exit(ok ? 0 : 1);
})();
