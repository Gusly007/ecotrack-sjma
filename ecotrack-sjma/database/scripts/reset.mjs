#!/usr/bin/env node

/**
 * Script pour réinitialiser complètement la base de données
 * et réappliquer les migrations + seeds
 *
 * Usage:
 *   npm run db:reset
 *   npm run reset
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { logInfo, logSuccess, logError } from './db-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATABASE_DIR = path.resolve(__dirname, '..');

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      cwd: DATABASE_DIR,
      stdio: 'inherit',
      shell: true,
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    proc.on('error', reject);
  });
}

async function main() {
  try {
    logInfo('=== RESET COMPLET DE LA BASE DE DONNÉES ===\n');

    // Étape 1: Supprimer toutes les tables
    logInfo('Étape 1/3: Suppression des tables...');
    await runCommand('node', ['scripts/fresh.mjs']);

    // Étape 2: Exécuter les migrations
    logInfo('\nÉtape 2/3: Exécution des migrations...');
    await runCommand('npm', ['run', 'migrate']);

    // Étape 3: Exécuter les seeds
    logInfo('\nÉtape 3/3: Exécution des seeds...');
    await runCommand('npm', ['run', 'seed']);

    logSuccess('\n=== RESET TERMINÉ AVEC SUCCÈS ===');
  } catch (err) {
    logError(`Erreur pendant le reset: ${err.message}`);
    process.exit(1);
  }
}

main();
