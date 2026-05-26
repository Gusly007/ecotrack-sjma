#!/usr/bin/env node
/**
 * EcoTrack — Sauvegarde automatique PostgreSQL (cross-platform)
 *
 * Usage:
 *   node scripts/backup.mjs                  # Sauvegarde complète
 *   node scripts/backup.mjs --dry-run        # Simulation sans écriture
 *   node scripts/backup.mjs --retention 14   # Rétention 14 jours (défaut: 7)
 *   node scripts/backup.mjs --list           # Lister les sauvegardes existantes
 *   node scripts/backup.mjs --verify         # Vérifier la dernière sauvegarde
 *
 * Planification automatique (package.json) :
 *   npm run backup        → sauvegarde immédiate
 *   npm run backup:list   → inventaire
 *   npm run backup:verify → contrôle d'intégrité
 */

import { execSync, spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const ENV_FILE = path.join(PROJECT_ROOT, '.env');

// ── Configuration ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN    = args.includes('--dry-run');
const LIST_ONLY  = args.includes('--list');
const VERIFY     = args.includes('--verify');
const retIdx     = args.indexOf('--retention');
const RETENTION  = retIdx >= 0 ? parseInt(args[retIdx + 1], 10) : 7;
const outIdx     = args.indexOf('--output');
const BACKUP_DIR = outIdx >= 0
  ? args[outIdx + 1]
  : path.join(PROJECT_ROOT, 'backups', 'db');

// ── Utilitaires log ──────────────────────────────────────────────────────────

const now = () => new Date().toISOString().replace('T', ' ').substring(0, 19);
const info    = (msg) => console.log(`[${now()}] INFO  ${msg}`);
const success = (msg) => console.log(`[${now()}] OK    ${msg}`);
const warn    = (msg) => console.warn(`[${now()}] WARN  ${msg}`);
const error   = (msg) => { console.error(`[${now()}] ERROR ${msg}`); };

// ── Chargement .env ──────────────────────────────────────────────────────────

function loadEnv() {
  if (!fs.existsSync(ENV_FILE)) { warn('.env non trouvé — variables système utilisées'); return; }
  const lines = fs.readFileSync(ENV_FILE, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.substring(0, eqIdx).trim();
    const val = trimmed.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
  info(`Variables chargées depuis ${ENV_FILE}`);
}

// ── Variables PostgreSQL ─────────────────────────────────────────────────────

function getPgConfig() {
  return {
    host:     process.env.PGHOST     || process.env.DB_HOST     || 'localhost',
    port:     process.env.PGPORT     || process.env.DB_PORT     || '5432',
    user:     process.env.PGUSER     || process.env.DB_USER     || 'ecotrack_user',
    password: process.env.PGPASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.PGDATABASE || process.env.DB_NAME     || 'ecotrack',
  };
}

// ── Checksum SHA-256 ─────────────────────────────────────────────────────────

function computeChecksum(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function writeChecksum(filePath, checksum) {
  fs.writeFileSync(`${filePath}.sha256`, `${checksum}  ${path.basename(filePath)}\n`, 'utf-8');
}

function verifyChecksum(filePath) {
  const checksumFile = `${filePath}.sha256`;
  if (!fs.existsSync(checksumFile)) { warn(`Pas de checksum pour ${path.basename(filePath)}`); return false; }
  const expected = fs.readFileSync(checksumFile, 'utf-8').split(' ')[0];
  const actual   = computeChecksum(filePath);
  return expected === actual;
}

// ── Liste des sauvegardes ────────────────────────────────────────────────────

function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) { info('Aucun répertoire de sauvegarde trouvé'); return []; }
  return fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('ecotrack_backup_') && f.endsWith('.sql.gz'))
    .map(f => {
      const fullPath = path.join(BACKUP_DIR, f);
      const stat = fs.statSync(fullPath);
      return { name: f, path: fullPath, size: stat.size, mtime: stat.mtime };
    })
    .sort((a, b) => b.mtime - a.mtime);
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

// ── Vérification disponibilité pg_dump ───────────────────────────────────────

function checkPgDump() {
  const result = spawnSync('pg_dump', ['--version'], { encoding: 'utf-8' });
  if (result.status !== 0) throw new Error('pg_dump introuvable. Installez postgresql-client.');
  info(`pg_dump disponible: ${result.stdout.trim()}`);
}

// ── Sauvegarde principale ────────────────────────────────────────────────────

async function runBackup(pg) {
  const timestamp  = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const backupName = `ecotrack_backup_${timestamp}`;
  const backupFile = path.join(BACKUP_DIR, `${backupName}.sql.gz`);
  const latestLink = path.join(BACKUP_DIR, 'latest.sql.gz');

  info(`Démarrage de la sauvegarde → ${backupFile}`);

  if (DRY_RUN) {
    info(`[DRY-RUN] pg_dump -h ${pg.host} -p ${pg.port} -U ${pg.user} -d ${pg.database} | gzip > ${backupFile}`);
    return null;
  }

  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const env = { ...process.env, PGPASSWORD: pg.password };

  const pgDumpArgs = [
    '-h', pg.host,
    '-p', pg.port,
    '-U', pg.user,
    '-d', pg.database,
    '--no-owner',
    '--no-acl',
    '--format=plain',
    '--encoding=UTF8',
  ];

  // pg_dump | gzip — on redirige via shell pour la portabilité
  const cmd = `pg_dump ${pgDumpArgs.join(' ')} | gzip -9 > "${backupFile}"`;
  execSync(cmd, { env, stdio: ['ignore', 'pipe', 'pipe'], shell: true });

  const stat = fs.statSync(backupFile);
  success(`Dump compressé: ${backupFile} (${formatSize(stat.size)})`);

  const checksum = computeChecksum(backupFile);
  writeChecksum(backupFile, checksum);
  success(`Checksum SHA-256: ${checksum.substring(0, 16)}...`);

  // Lien symbolique vers la dernière sauvegarde (Unix seulement)
  try {
    if (fs.existsSync(latestLink)) fs.unlinkSync(latestLink);
    fs.symlinkSync(backupFile, latestLink);
  } catch {
    // Windows : symlink nécessite des droits élévés — on copie le chemin dans un fichier texte
    fs.writeFileSync(`${BACKUP_DIR}/latest.txt`, backupFile, 'utf-8');
  }

  return backupFile;
}

// ── Rotation des sauvegardes expirées ────────────────────────────────────────

function rotateBackups() {
  info(`Rotation — conservation des ${RETENTION} derniers jours`);
  const backups = listBackups();
  const cutoff  = Date.now() - RETENTION * 24 * 60 * 60 * 1000;
  let deleted   = 0;

  for (const bk of backups) {
    if (bk.mtime.getTime() < cutoff) {
      if (DRY_RUN) {
        info(`[DRY-RUN] Supprimerait: ${bk.name}`);
      } else {
        fs.unlinkSync(bk.path);
        const cs = `${bk.path}.sha256`;
        if (fs.existsSync(cs)) fs.unlinkSync(cs);
        info(`Supprimé: ${bk.name}`);
      }
      deleted++;
    }
  }

  if (deleted === 0) info('Aucun fichier expiré');
  else success(`${deleted} sauvegarde(s) expirée(s) supprimée(s)`);
}

// ── Vérification d'intégrité ─────────────────────────────────────────────────

function verifyLatest() {
  const backups = listBackups();
  if (backups.length === 0) { warn('Aucune sauvegarde à vérifier'); return; }
  const latest = backups[0];
  info(`Vérification: ${latest.name}`);
  const ok = verifyChecksum(latest.path);
  if (ok) success(`Intégrité OK — ${latest.name}`);
  else    error(`Intégrité ÉCHOUÉE — ${latest.name} est corrompu!`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  info('════════════════════════════════════════════════════════');
  info('  EcoTrack — Backup PostgreSQL automatique');
  info('════════════════════════════════════════════════════════');

  loadEnv();
  const pg = getPgConfig();
  info(`Cible: ${pg.host}:${pg.port}/${pg.database}`);

  if (LIST_ONLY) {
    const backups = listBackups();
    if (backups.length === 0) { info('Aucune sauvegarde disponible'); return; }
    info(`${backups.length} sauvegarde(s) dans ${BACKUP_DIR}:`);
    for (const bk of backups) {
      const ok = verifyChecksum(bk.path);
      console.log(`  ${ok ? '✔' : '✗'} ${bk.name} — ${formatSize(bk.size)} — ${bk.mtime.toISOString()}`);
    }
    return;
  }

  if (VERIFY) { verifyLatest(); return; }

  checkPgDump();

  const backupFile = await runBackup(pg);
  rotateBackups();

  const backups = listBackups();
  info(`Sauvegardes disponibles: ${backups.length}`);
  for (const bk of backups.slice(0, 5)) {
    console.log(`  ${bk.name} — ${formatSize(bk.size)}`);
  }

  if (backupFile) {
    success('════════════════════════════════════════════════════════');
    success(`Sauvegarde réussie: ${path.basename(backupFile)}`);
    info(`Pour restaurer:`);
    info(`  gunzip -c "${backupFile}" | psql -h ${pg.host} -U ${pg.user} -d ${pg.database}`);
  }
}

main().catch(err => { error(err.message); process.exit(1); });
