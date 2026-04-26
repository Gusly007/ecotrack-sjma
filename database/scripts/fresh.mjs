#!/usr/bin/env node

/**
 * Script pour réinitialiser complètement la base de données
 * Supprime toutes les tables et la table de migrations
 *
 * Usage:
 *   npm run db:fresh
 */

import {
  createClient,
  logSuccess,
  logError,
  logInfo,
  logWarning,
} from './db-utils.mjs';

async function dropAllTables(client) {
  logWarning('Suppression de toutes les tables...');

  // Récupérer toutes les tables
  const result = await client.query(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename != 'spatial_ref_sys'
  `);

  const tables = result.rows.map(row => row.tablename);

  if (tables.length === 0) {
    logInfo('Aucune table à supprimer');
    return;
  }

  // Désactiver les contraintes FK temporairement
  await client.query('SET session_replication_role = replica;');

  for (const table of tables) {
    try {
      await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
      logInfo(`  Supprimée: ${table}`);
    } catch (err) {
      logWarning(`  Impossible de supprimer ${table}: ${err.message}`);
    }
  }

  // Réactiver les contraintes FK
  await client.query('SET session_replication_role = DEFAULT;');

  logSuccess(`${tables.length} tables supprimées`);
}

async function main() {
  const client = createClient();

  try {
    await client.connect();
    logInfo('Connecté à la base de données');

    await dropAllTables(client);

    logSuccess('Base de données réinitialisée!');
    logInfo('Exécutez maintenant: npm run migrate && npm run seed');
  } catch (err) {
    logError(`Erreur: ${err.message}`);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
