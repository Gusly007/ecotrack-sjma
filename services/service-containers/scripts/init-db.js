const fs = require('fs');
const path = require('path');
const db = require('../src/db/connexion');

(async () => {
  try {
    const candidatePg = path.join(__dirname, '..', 'src', 'db', 'init-db-pg.sql');
    const candidateMy = path.join(__dirname, '..', 'src', 'db', 'init-db.sql');
    let sqlPath;
    if (fs.existsSync(candidatePg)) {
      sqlPath = candidatePg;
    } else if (fs.existsSync(candidateMy)) {
      sqlPath = candidateMy;
    } else {
      throw new Error('No SQL init file found (looked for init-db-pg.sql and init-db.sql)');
    }
    console.log('Using SQL init file:', sqlPath);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split on semicolons and execute each non-empty statement (simple approach)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      console.log('Executing:', stmt.split('\n')[0].slice(0, 200));
      await db.query(stmt);
    }

    console.log('Database initialization complete.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }
})();
