#!/usr/bin/env node

/**
 * Script pour exécuter les seeders
 *
 * Usage:
 *   npm run seed          # Exécute tous les seeders
 *   npm run seed:fresh    # Vide les tables puis exécute les seeders
 */

import path from 'path';
import { fileURLToPath } from 'url';
import {
  createClient,
  listSqlFiles,
  executeSqlFile,
  logSuccess,
  logError,
  logInfo,
  logWarning,
} from './db-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEEDS_DIR = path.resolve(__dirname, '../seeds');

async function truncateTables(client) {
  logWarning('Suppression des données existantes...');

  // Ordre inversé des dépendances pour éviter les erreurs FK
  const tables = [
    'refresh_tokens',
    'alerte_capteur',
    'journal_audit',
    'historique_statut',
    'notification',
    'historique_points',
    'traitement_signalement',
    'signalement',
    'collecte',
    'etape_tournee',
    'tournee',
    'mesure',
    'capteur',
    'conteneur',
    'user_badge',
    'user_role',
    'utilisateur',
    'vehicule',
    'zone',
    'badge',
    'type_conteneur',
    'type_signalement',
    'maintenance',
    'role',
  ];

  for (const table of tables) {
    try {
      await client.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
    } catch (err) {
      // Table n'existe peut-être pas encore
    }
  }

  logSuccess('Tables vidées');
}

async function runSeeds(client) {
  const seedFiles = listSqlFiles(SEEDS_DIR);

  if (seedFiles.length === 0) {
    logWarning('Aucun fichier de seed trouvé dans ' + SEEDS_DIR);
    return;
  }

  logInfo(`Exécution de ${seedFiles.length} fichiers de seed...`);

  for (const file of seedFiles) {
    const filePath = path.join(SEEDS_DIR, file);
    try {
      await executeSqlFile(client, filePath);
      logSuccess(`Seed: ${file}`);
    } catch (err) {
      logError(`Erreur dans ${file}: ${err.message}`);
      throw err;
    }
  }
}

async function main() {
  const isFresh = process.argv.includes('--fresh');
  const client = createClient();

  try {
    await client.connect();
    logInfo('Connecté à la base de données');

    if (isFresh) {
      await truncateTables(client);
    }

    await runSeeds(client);

    logSuccess('Seeding terminé avec succès!');
  } catch (err) {
    logError(`Erreur: ${err.message}`);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
