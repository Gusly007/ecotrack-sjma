/**
 * Utilitaires pour la gestion de la base de données
 */

import pg from 'pg';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Obtenir l'URL de connexion à la base de données
 */
export function getDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const user = process.env.DB_USER || 'ecotrack_user';
  const password = process.env.DB_PASSWORD || 'ecotrack_password';
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || 5432;
  const database = process.env.DB_NAME || 'ecotrack';

  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
}

/**
 * Créer un client PostgreSQL
 */
export function createClient() {
  return new pg.Client({
    connectionString: getDatabaseUrl(),
  });
}

/**
 * Créer un pool de connexions PostgreSQL
 */
export function createPool() {
  return new pg.Pool({
    connectionString: getDatabaseUrl(),
  });
}

/**
 * Exécuter un fichier SQL
 */
export async function executeSqlFile(client, filePath) {
  const sql = fs.readFileSync(filePath, 'utf-8');
  await client.query(sql);
}

/**
 * Lister les fichiers SQL dans un dossier (triés par nom)
 */
export function listSqlFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs.readdirSync(directory)
    .filter(file => file.endsWith('.sql'))
    .sort();
}

/**
 * Afficher un message coloré dans la console
 */
export const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

export function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

export function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

export function logError(message) {
  log(`❌ ${message}`, 'red');
}

export function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

export function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}
