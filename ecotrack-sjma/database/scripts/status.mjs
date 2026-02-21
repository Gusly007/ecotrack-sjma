#!/usr/bin/env node

/**
 * Script pour afficher le statut de la base de données
 *
 * Usage:
 *   npm run db:status
 */

import {
  createClient,
  logSuccess,
  logError,
  logInfo,
  logWarning
} from './db-utils.mjs';

async function main() {
  const client = createClient();

  try {
    await client.connect();
    logSuccess('Connexion à la base de données OK\n');

    // Version PostgreSQL
    const versionResult = await client.query('SELECT version()');
    logInfo(`PostgreSQL: ${versionResult.rows[0].version.split(',')[0]}`);

    // Extensions
    const extResult = await client.query(`
      SELECT extname, extversion FROM pg_extension
      WHERE extname IN ('postgis', 'uuid-ossp', 'pgcrypto', 'pg_trgm')
      ORDER BY extname
    `);
    logInfo('Extensions:');
    extResult.rows.forEach(row => {
      logInfo(`- ${row.extname} v${row.extversion}`);
    });

    // Tables
    const tablesResult = await client.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename != 'spatial_ref_sys'
      ORDER BY tablename
    `);
    logInfo(`Tables (${tablesResult.rows.length}):`);
    tablesResult.rows.forEach(row => {
      logInfo(`- ${row.tablename}`);
    });

    // Migrations appliquées
    try {
      const migrationsResult = await client.query(`
        SELECT name, run_on FROM pgmigrations ORDER BY run_on DESC LIMIT 10
      `);
      logInfo(`Dernieres migrations (${migrationsResult.rows.length}):`);
      migrationsResult.rows.forEach(row => {
        const date = new Date(row.run_on).toLocaleString();
        logInfo(`- ${row.name} (${date})`);
      });
    } catch {
      logWarning('\nTable de migrations non trouvée (aucune migration exécutée)');
    }

    // Stats
    logInfo('Statistiques:');
    const stats = [
      { table: 'utilisateur', label: 'Utilisateurs' },
      { table: 'conteneur', label: 'Conteneurs' },
      { table: 'zone', label: 'Zones' },
      { table: 'capteur', label: 'Capteurs' },
      { table: 'mesure', label: 'Mesures' },
    ];

    for (const { table, label } of stats) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
        logInfo(`${label}: ${result.rows[0].count}`);
      } catch {
        logInfo(`${label}: (table non creee)`);
      }
    }

  } catch (err) {
    logError(`Erreur de connexion: ${err.message}`);
    logWarning('Assurez-vous que PostgreSQL est démarré: docker compose up -d postgres');
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
