const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection config
const client = new Client({
  host: 'localhost',
  port: 5434,
  database: 'ecotrack',
  user: 'postgres',
  password: 'postgres'
});

async function runMigrations() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Get list of migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.cjs'))
      .sort();

    console.log(`Found ${files.length} migration files`);

    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS pgmigrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        run_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get already run migrations
    const { rows: runMigrations } = await client.query('SELECT name FROM pgmigrations');
    const runSet = new Set(runMigrations.map(r => r.name));

    for (const file of files) {
      if (runSet.has(file)) {
        console.log(`Skipping ${file} (already run)`);
        continue;
      }

      console.log(`Running migration: ${file}`);
      
      // Load and execute migration
      const migration = require(path.join(migrationsDir, file));
      
      await client.query('BEGIN');
      try {
        // Mock pgm object
        const pgm = {
          sql: (sql) => client.query(sql)
        };
        
        await migration.up(pgm);
        await client.query('INSERT INTO pgmigrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`✓ ${file} completed`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }

    console.log('\nAll migrations completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
