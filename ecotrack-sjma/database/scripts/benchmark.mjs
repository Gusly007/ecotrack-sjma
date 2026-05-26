#!/usr/bin/env node

/**
 * Performance Benchmark pour EcoTrack
 *
 * Mesure les performances de la base de donnees AVANT et APRES optimisation.
 *
 * Usage:
 *   node scripts/benchmark.mjs --seed          # Seed + avant + apres
 *   node scripts/benchmark.mjs --avant         # Benchmark avant optimisation
 *   node scripts/benchmark.mjs --apres         # Benchmark apres optimisation
 *   node scripts/benchmark.mjs --full          # Seed + avant + optim + apres
 *   node scripts/benchmark.mjs --compare       # Comparer avant/apres existants
 *   node scripts/benchmark.mjs --seed-only     # Seulement seed des donnees
 *   node scripts/benchmark.mjs --optim-only    # Seulement appliquer optimisations
 *
 * Cibles de performance:
 *   - 2000 conteneurs
 *   - 15 000 utilisateurs (5 agents, 20 gestionnaires, 10 admins)
 *   - 2000 mesures / 5 min = 400 msg/min
 *   - 500 utilisateurs simultanes
 *   - Futur: 10 000 conteneurs
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  createClient,
  createPool,
  executeSqlFile,
  logSuccess,
  logError,
  logInfo,
  logWarning,
} from './db-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEEDS_DIR = path.resolve(__dirname, '../seeds');
const MIGRATIONS_DIR = path.resolve(__dirname, '../migrations');

// ─── Configuration ───────────────────────────────────────────────────────────

const BENCHMARK_ITERATIONS = 3;
const CONCURRENT_USERS = 500;
const INSERT_BATCH_SIZE = 2000;

// ─── Utilitaires ─────────────────────────────────────────────────────────────

function roundMs(ms) {
  return Math.round(ms * 100) / 100;
}

function average(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Benchmark Queries ───────────────────────────────────────────────────────

const BENCHMARK_QUERIES = [
  {
    id: 'Q01',
    name: 'Dernieres 10 mesures d\'un capteur',
    description: 'Recupere les 10 dernieres mesures pour un capteur specifique',
    query: `
      SELECT * FROM mesure
      WHERE id_capteur = $1
      ORDER BY date_heure_mesure DESC
      LIMIT 10
    `,
    params: [1],
  },
  {
    id: 'Q02',
    name: 'Dernier remplissage de tous les conteneurs d\'une zone',
    description: 'Jointure LATERAL pour trouver le dernier niveau de remplissage par conteneur dans une zone',
    query: `
      SELECT c.id_conteneur, c.uid, c.statut,
             COALESCE(m.niveau_remplissage_pct, NULL) AS fill_level
      FROM conteneur c
      LEFT JOIN LATERAL (
        SELECT niveau_remplissage_pct
        FROM mesure
        WHERE id_conteneur = c.id_conteneur
        ORDER BY date_heure_mesure DESC
        LIMIT 1
      ) m ON TRUE
      WHERE c.id_zone = $1
      ORDER BY fill_level DESC NULLS LAST
    `,
    params: [1],
  },
  {
    id: 'Q03',
    name: 'Statistiques des conteneurs par statut',
    description: 'Aggregation du nombre de conteneurs par statut avec capacite moyenne',
    query: `
      SELECT statut, COUNT(*) AS total, AVG(capacite_l)::numeric(10,2) AS capacite_moy
      FROM conteneur
      GROUP BY statut
      ORDER BY total DESC
    `,
    params: [],
  },
  {
    id: 'Q04',
    name: 'Mesures des dernieres 24h',
    description: 'Toutes les mesures dans un intervalle de temps (24h)',
    query: `
      SELECT COUNT(*) AS total, AVG(niveau_remplissage_pct)::numeric(5,2) AS avg_fill,
             MIN(niveau_remplissage_pct) AS min_fill, MAX(niveau_remplissage_pct) AS max_fill,
             AVG(batterie_pct)::numeric(5,2) AS avg_battery
      FROM mesure
      WHERE date_heure_mesure >= NOW() - INTERVAL '24 hours'
    `,
    params: [],
  },
  {
    id: 'Q05',
    name: 'Authentification utilisateur par email',
    description: 'Recherche d\'un utilisateur par email (login)',
    query: `
      SELECT id_utilisateur, email, password_hash, nom, prenom, role_par_defaut, est_active
      FROM utilisateur
      WHERE email = $1
    `,
    params: ['admin1@ecotrack.local'],
  },
  {
    id: 'Q06',
    name: 'Notifications non lues d\'un utilisateur',
    description: 'Recupere les notifications non lues les plus recentes',
    query: `
      SELECT id_notification, type, titre, corps, date_creation
      FROM notification
      WHERE id_utilisateur = $1 AND est_lu = FALSE
      ORDER BY date_creation DESC
      LIMIT 20
    `,
    params: [1],
  },
  {
    id: 'Q07',
    name: 'Alertes capteur actives par type',
    description: 'Alertes capteur actives groupees par type',
    query: `
      SELECT type_alerte, COUNT(*) AS total, AVG(valeur_detectee)::numeric(5,2) AS avg_valeur
      FROM alerte_capteur
      WHERE statut = 'ACTIVE'
      GROUP BY type_alerte
      ORDER BY total DESC
    `,
    params: [],
  },
  {
    id: 'Q08',
    name: 'Moyenne de remplissage par type de conteneur',
    description: 'Jointure mesure -> conteneur -> type_conteneur avec aggregation',
    query: `
      SELECT tc.nom AS type_conteneur,
             COUNT(DISTINCT m.id_conteneur) AS conteneurs_mesures,
             AVG(m.niveau_remplissage_pct)::numeric(5,2) AS avg_fill_level
      FROM mesure m
      JOIN conteneur c ON c.id_conteneur = m.id_conteneur
      JOIN type_conteneur tc ON tc.id_type = c.id_type
      WHERE m.date_heure_mesure >= NOW() - INTERVAL '7 days'
      GROUP BY tc.nom
      ORDER BY avg_fill_level DESC
    `,
    params: [],
  },
  {
    id: 'Q09',
    name: 'Tournees planifiees pour un agent',
    description: 'Recupere les tournees a venir pour un agent specifique',
    query: `
      SELECT t.id_tournee, t.code, t.date_tournee, t.statut, t.distance_prevue_km,
             z.nom AS zone_nom, v.numero_immatriculation
      FROM tournee t
      LEFT JOIN zone z ON z.id_zone = t.id_zone
      LEFT JOIN vehicule v ON v.id_vehicule = t.id_vehicule
      WHERE t.id_agent = $1
      ORDER BY t.date_tournee DESC
      LIMIT 20
    `,
    params: [1],
  },
  {
    id: 'Q10',
    name: 'Mesures avec niveau > 80% (critique)',
    description: 'Recherche de mesures critiques avec jointure conteneur',
    query: `
      SELECT m.id_mesure, c.uid, m.niveau_remplissage_pct, m.batterie_pct,
             m.date_heure_mesure
      FROM mesure m
      JOIN conteneur c ON c.id_conteneur = m.id_conteneur
      WHERE m.niveau_remplissage_pct > 80
        AND m.date_heure_mesure >= NOW() - INTERVAL '24 hours'
      ORDER BY m.niveau_remplissage_pct DESC
      LIMIT 100
    `,
    params: [],
  },
];

// ─── Phase 1: Run Benchmark Queries ──────────────────────────────────────────

async function runQueryBenchmark(client, phase) {
  logInfo(`\n📊 Phase ${phase}: Execution des requetes benchmark...`);

  const results = [];

  for (const bq of BENCHMARK_QUERIES) {
    const times = [];

    for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
      try {
        const start = Date.now();
        await client.query('EXPLAIN ANALYZE ' + bq.query, bq.params);
        const elapsed = Date.now() - start;

        // Run actual query too
        const dataStart = Date.now();
        const result = await client.query(bq.query, bq.params);
        const dataElapsed = Date.now() - dataStart;

        times.push(dataElapsed);

        if (i === 0) {
          results.push({
            ...bq,
            execution_times_ms: [dataElapsed],
            rows_returned: result.rows.length,
            explain_analyze_ms: elapsed,
          });
        } else {
          const existing = results.find(r => r.id === bq.id);
          existing.execution_times_ms.push(dataElapsed);
        }
      } catch (err) {
        logError(`  ${bq.id} - ${bq.name}: ${err.message}`);
      }
    }
  }

  // Ajouter les stats calculees
  for (const r of results) {
    r.avg_ms = roundMs(average(r.execution_times_ms));
    r.min_ms = roundMs(Math.min(...r.execution_times_ms));
    r.max_ms = roundMs(Math.max(...r.execution_times_ms));
  }

  return results;
}

// ─── Phase 2: Insert Throughput Benchmark ────────────────────────────────────

async function runInsertBenchmark(client, phase) {
  logInfo(`\n💾 Phase ${phase}: Benchmark d'insertion...`);

  const results = [];

  // Test 1: Insertion sequentielle de mesures
  logInfo('  Test 2a: Insertion sequentielle de ' + INSERT_BATCH_SIZE + ' mesures...');

  // Get a valid capteur and conteneur
  const ref = await client.query(
    'SELECT id_conteneur, id_capteur FROM capteur LIMIT 1'
  );
  const { id_conteneur: refContId, id_capteur: refCaptId } = ref.rows[0];

  const sequentialStart = Date.now();
  for (let i = 0; i < INSERT_BATCH_SIZE; i++) {
    await client.query(
      `INSERT INTO mesure (id_conteneur, id_capteur, niveau_remplissage_pct, batterie_pct, temperature, date_heure_mesure)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [refContId, refCaptId, Math.random() * 100, 50 + Math.random() * 50, 15 + Math.random() * 15]
    );
  }
  const sequentialTotal = Date.now() - sequentialStart;
  const sequentialPerSec = roundMs(INSERT_BATCH_SIZE / (sequentialTotal / 1000));
  logSuccess(`    ${INSERT_BATCH_SIZE} insertions en ${sequentialTotal}ms (${sequentialPerSec}/sec)`);

  results.push({
    test: 'Insertion sequentielle',
    count: INSERT_BATCH_SIZE,
    total_ms: sequentialTotal,
    per_second: sequentialPerSec,
  });

  // Test 2: Insertion par lot (batch INSERT)
  logInfo('  Test 2b: Insertion par lot de ' + INSERT_BATCH_SIZE + ' mesures...');
  const batchValues = [];
  const batchParams = [];
  let paramIdx = 1;

  for (let i = 0; i < INSERT_BATCH_SIZE; i++) {
    batchValues.push(
      `($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4}, NOW())`
    );
    batchParams.push(refContId, refCaptId, Math.random() * 100, 50 + Math.random() * 50, 15 + Math.random() * 15);
    paramIdx += 5;
  }

  const batchStart = Date.now();
  await client.query(
    `INSERT INTO mesure (id_conteneur, id_capteur, niveau_remplissage_pct, batterie_pct, temperature, date_heure_mesure) VALUES ${batchValues.join(', ')}`,
    batchParams
  );
  const batchTotal = Date.now() - batchStart;
  const batchPerSec = roundMs(INSERT_BATCH_SIZE / (batchTotal / 1000));
  logSuccess(`    ${INSERT_BATCH_SIZE} insertions en ${batchTotal}ms (${batchPerSec}/sec)`);

  results.push({
    test: 'Insertion par lot',
    count: INSERT_BATCH_SIZE,
    total_ms: batchTotal,
    per_second: batchPerSec,
  });

  return results;
}

// ─── Phase 3: Concurrent Users Benchmark ─────────────────────────────────────

async function runConcurrentBenchmark(phase) {
  logInfo(`\n👥 Phase ${phase}: Simulation de ${CONCURRENT_USERS} utilisateurs simultanes...`);

  const pool = createPool();
  const results = [];

  try {
    // Test: Execution concurrente de requetes
    logInfo('  Test 3a: ' + CONCURRENT_USERS + ' requetes select simultanees...');

    const queries = [
      'SELECT COUNT(*) FROM mesure WHERE date_heure_mesure >= NOW() - INTERVAL \'1 hour\'',
      'SELECT id_conteneur, uid, statut FROM conteneur WHERE statut = $1',
      'SELECT id_utilisateur, email, nom, prenom FROM utilisateur WHERE role_par_defaut = $1 LIMIT 100',
      'SELECT COUNT(*) FROM notification WHERE est_lu = FALSE',
      'SELECT tc.nom, COUNT(c.id_conteneur) FROM type_conteneur tc LEFT JOIN conteneur c ON c.id_type = tc.id_type GROUP BY tc.nom',
    ];

    const concurrentStart = Date.now();
    const promises = [];

    for (let i = 0; i < CONCURRENT_USERS; i++) {
      const q = queries[i % queries.length];
      const params = q.includes('$1')
        ? [['ACTIF', 'CITOYEN', 'AGENT', 'GESTIONNAIRE', 'ADMIN'][i % 5]]
        : [];

      if (i < 50) {
        // Les 50 premiers: mesure individuelle
        promises.push(pool.query(q, params));
      } else {
        // Le reste: on les envoie sans attendre individuellement
        pool.query(q, params).catch(() => {});
      }
    }

    await Promise.allSettled(promises);
    const concurrentTotal = Date.now() - concurrentStart;

    logSuccess(`    ${CONCURRENT_USERS} requetes concurrentes en ${concurrentTotal}ms`);
    logSuccess(`    Debit: ${roundMs(CONCURRENT_USERS / (concurrentTotal / 1000))} requetes/sec`);

    results.push({
      test: 'Requetes concurrentes',
      users: CONCURRENT_USERS,
      total_ms: concurrentTotal,
      throughput_per_sec: roundMs(CONCURRENT_USERS / (concurrentTotal / 1000)),
    });

    // Test: Simulation flux IoT (insertions concurrentes)
    logInfo('  Test 3b: Simulation flux IoT - ' + INSERT_BATCH_SIZE + ' insertions concurrentes...');

    const ref = await pool.query(
      'SELECT id_conteneur, id_capteur FROM capteur LIMIT 500'
    );
    const capteurs = ref.rows;

    const iotStart = Date.now();
    const iotPromises = [];

    for (let i = 0; i < INSERT_BATCH_SIZE; i++) {
      const cap = capteurs[i % capteurs.length];
      iotPromises.push(
        pool.query(
          `INSERT INTO mesure (id_conteneur, id_capteur, niveau_remplissage_pct, batterie_pct, temperature, date_heure_mesure)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [cap.id_conteneur, cap.id_capteur, Math.random() * 100, 50 + Math.random() * 50, 15 + Math.random() * 15]
        )
      );
    }

    await Promise.allSettled(iotPromises);
    const iotTotal = Date.now() - iotStart;
    const iotPerSec = roundMs(INSERT_BATCH_SIZE / (iotTotal / 1000));
    logSuccess(`    ${INSERT_BATCH_SIZE} insertions IoT en ${iotTotal}ms (${iotPerSec}/sec)`);

    results.push({
      test: 'Insertions IoT concurrentes',
      count: INSERT_BATCH_SIZE,
      total_ms: iotTotal,
      throughput_per_sec: iotPerSec,
    });

  } finally {
    await pool.end();
  }

  return results;
}

// ─── Phase 4: Table and Index Statistics ──────────────────────────────────────

async function runStatsBenchmark(client, phase) {
  logInfo(`\n📐 Phase ${phase}: Statistiques des tables et index...`);

  const stats = {};

  // Taille des tables
  const tableSizes = await client.query(`
    SELECT
      relname AS table_name,
      pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
      pg_size_pretty(pg_relation_size(relid)) AS table_size,
      pg_size_pretty(pg_indexes_size(relid)) AS index_size,
      pg_total_relation_size(relid) AS total_size_bytes,
      (SELECT reltuples::bigint FROM pg_class WHERE oid = relid) AS estimated_rows
    FROM pg_catalog.pg_statio_user_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(relid) DESC
  `);
  stats.tables = tableSizes.rows;

  // Liste des index avec taille
  const indexStats = await client.query(`
    SELECT
      indexrelid::regclass AS index_name,
      relid::regclass AS table_name,
      pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
      pg_relation_size(indexrelid) AS index_size_bytes,
      idx_scan AS index_scans
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    ORDER BY pg_relation_size(indexrelid) DESC
  `);
  stats.indexes = indexStats.rows;

  // Cache hit ratio
  const cacheHit = await client.query(`
    SELECT
      sum(heap_blks_hit)::bigint AS buffer_hits,
      sum(heap_blks_read)::bigint AS buffer_reads,
      CASE WHEN (sum(heap_blks_hit) + sum(heap_blks_read)) > 0
        THEN round(sum(heap_blks_hit)::numeric / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100, 2)
        ELSE NULL
      END AS cache_hit_ratio
    FROM pg_statio_user_tables
    WHERE schemaname = 'public'
  `);
  stats.cache_hit_ratio = cacheHit.rows[0]?.cache_hit_ratio;

  return stats;
}

// ─── Phase 5: Seed Data ──────────────────────────────────────────────────────

async function seedTargetData(client) {
  logInfo('\n🌱 Insertion des donnees a l\'echelle cible...');

  // Seed 020: 2000 conteneurs + 1M mesures
  const seed020Path = path.join(SEEDS_DIR, '020_complete_massive_seed.sql');
  if (fs.existsSync(seed020Path)) {
    logInfo('  Execution du seed 020 (2000 conteneurs, 1M mesures)...');
    await executeSqlFile(client, seed020Path);
    logSuccess('  Seed 020 termine');
  }

  // Seed 027: 15k utilisateurs
  const seed022Path = path.join(SEEDS_DIR, '027_production_scale_seed.sql');
  if (fs.existsSync(seed022Path)) {
    logInfo('  Execution du seed 027 (15k utilisateurs, mesures supplementaires)...');
    await executeSqlFile(client, seed022Path);
    logSuccess('  Seed 027 termine');
  }

  logSuccess('Donnees inserees avec succes');
}

// ─── Phase 6: Apply Optimization Migration ────────────────────────────────────

async function applyOptimizations(client) {
  logInfo('\n🔧 Application des optimisations (migration 034)...');

  const migPath = path.join(MIGRATIONS_DIR, '034_db_optimization_indexes.cjs');
  if (!fs.existsSync(migPath)) {
    logWarning('  Migration 034 non trouvee, skipping');
    return false;
  }

  const migration = await import(migPath);
  const pgm = { sql: (sql) => client.query(sql) };

  await client.query('BEGIN');
  try {
    await migration.up(pgm);
    await client.query('COMMIT');
    logSuccess('  Optimisations appliquees avec succes');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    logError('  Erreur lors de l\'application: ' + err.message);
    throw err;
  }
}

// ─── Report Generation ────────────────────────────────────────────────────────

function generateReport(avantResults, apresResults) {
  logInfo('\n═══════════════════════════════════════════════════════════════');
  logInfo('  RAPPORT DE BENCHMARK - AVANT vs APRES OPTIMISATION');
  logInfo('═══════════════════════════════════════════════════════════════\n');

  const reportLines = [];
  const now = new Date().toISOString();
  reportLines.push('=== RAPPORT DE BENCHMARK ECOTRACK ===');
  reportLines.push(`Date: ${now}`);
  reportLines.push('');

  // Queries benchmark
  reportLines.push('--- Benchmark Requetes (temps moyen en ms) ---');
  reportLines.push(''.padStart(100, '-'));
  reportLines.push(
    'ID'.padEnd(5) +
    'Requete'.padEnd(50) +
    'AVANT (ms)'.padEnd(15) +
    'APRES (ms)'.padEnd(15) +
    'Gain (%)'.padEnd(15) +
    'Lignes'
  );
  reportLines.push(''.padStart(100, '-'));

  for (const avant of avantResults.queries) {
    const apres = apresResults.queries.find(a => a.id === avant.id);
    const gain = apres
      ? roundMs(((avant.avg_ms - apres.avg_ms) / avant.avg_ms) * 100)
      : null;

    reportLines.push(
      avant.id.padEnd(5) +
      avant.name.substring(0, 47).padEnd(50) +
      String(avant.avg_ms).padStart(10).padEnd(15) +
      String(apres ? apres.avg_ms : 'N/A').padStart(10).padEnd(15) +
      (gain !== null ? (gain > 0 ? '+' : '') + String(gain).padStart(10) : 'N/A'.padStart(10)).padEnd(15) +
      String(avant.rows_returned || 0)
    );
  }

  // Insert benchmark
  reportLines.push('');
  reportLines.push('--- Benchmark Insertion ---');
  reportLines.push(''.padStart(80, '-'));
  reportLines.push(
    'Test'.padEnd(35) +
    'AVANT'.padEnd(20) +
    'APRES'.padEnd(20) +
    'Gain (%)'
  );
  reportLines.push(''.padStart(80, '-'));

  for (let i = 0; i < avantResults.inserts.length; i++) {
    const avant = avantResults.inserts[i];
    const apres = apresResults.inserts[i];
    const gain = apres
      ? roundMs(((avant.per_second - apres.per_second) / avant.per_second) * 100)
      : null;

    reportLines.push(
      avant.test.substring(0, 32).padEnd(35) +
      String(avant.per_second + '/s').padStart(15).padEnd(20) +
      String(apres ? apres.per_second + '/s' : 'N/A').padStart(15).padEnd(20) +
      (gain !== null ? (gain > 0 ? '+' : '') + String(gain) : 'N/A')
    );
  }

  // Concurrent benchmark
  reportLines.push('');
  reportLines.push('--- Benchmark Concurrence ---');
  reportLines.push(''.padStart(80, '-'));
  reportLines.push(
    'Test'.padEnd(35) +
    'AVANT'.padEnd(20) +
    'APRES'.padEnd(20) +
    'Gain (%)'
  );
  reportLines.push(''.padStart(80, '-'));

  for (let i = 0; i < avantResults.concurrent.length; i++) {
    const avant = avantResults.concurrent[i];
    const apres = apresResults.concurrent[i];
    const gain = apres
      ? roundMs(((avant.throughput_per_sec - apres.throughput_per_sec) / avant.throughput_per_sec) * 100)
      : null;

    reportLines.push(
      (avant.test || 'Test').substring(0, 32).padEnd(35) +
      String(avant.throughput_per_sec + '/s').padStart(15).padEnd(20) +
      String(apres ? apres.throughput_per_sec + '/s' : 'N/A').padStart(15).padEnd(20) +
      (gain !== null ? (gain > 0 ? '+' : '') + String(gain) : 'N/A')
    );
  }

  // Stats tables
  reportLines.push('');
  reportLines.push('--- Statistiques des Tables ---');
  reportLines.push(''.padStart(80, '-'));
  reportLines.push(
    'Table'.padEnd(30) +
    'Taille'.padEnd(15) +
    'Index'.padEnd(15) +
    'Lignes est.'
  );
  reportLines.push(''.padStart(80, '-'));

  const tables = apresResults.stats?.tables || avantResults.stats?.tables || [];
  for (const t of tables) {
    reportLines.push(
      (t.table_name || '').substring(0, 27).padEnd(30) +
      (t.total_size || '').padStart(10).padEnd(15) +
      (t.index_size || '').padStart(10).padEnd(15) +
      String(t.estimated_rows || 0).padStart(10)
    );
  }

  // Cache hit ratio
  if (avantResults.stats?.cache_hit_ratio != null && apresResults.stats?.cache_hit_ratio != null) {
    reportLines.push('');
    reportLines.push('--- Cache Hit Ratio ---');
    reportLines.push(`  AVANT: ${avantResults.stats.cache_hit_ratio}%`);
    reportLines.push(`  APRES: ${apresResults.stats.cache_hit_ratio}%`);
  }

  reportLines.push('');
  reportLines.push('=== FIN DU RAPPORT ===');
  reportLines.push(`Date: ${now}`);

  const report = reportLines.join('\n');

  // Save to file
  const reportsDir = path.resolve(__dirname, '../../reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const filename = `benchmark-${now.replace(/[:.]/g, '-')}.txt`;
  const filepath = path.join(reportsDir, filename);
  fs.writeFileSync(filepath, report, 'utf-8');
  logSuccess(`Rapport sauvegarde: ${filepath}`);

  // Also save a comparison JSON for programmatic use
  const jsonPath = path.join(reportsDir, `benchmark-${now.replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify({
    date: now,
    avant: {
      queries: avantResults.queries.map(r => ({ id: r.id, name: r.name, avg_ms: r.avg_ms, rows: r.rows_returned })),
      inserts: avantResults.inserts,
      concurrent: avantResults.concurrent,
      cache_hit_ratio: avantResults.stats?.cache_hit_ratio,
    },
    apres: {
      queries: apresResults.queries.map(r => ({ id: r.id, name: r.name, avg_ms: r.avg_ms, rows: r.rows_returned })),
      inserts: apresResults.inserts,
      concurrent: apresResults.concurrent,
      cache_hit_ratio: apresResults.stats?.cache_hit_ratio,
    },
  }), 'utf-8');
  logSuccess(`Rapport JSON: ${jsonPath}`);

  // Print report to console
  console.log('\n' + report);

  return { filepath, jsonPath };
}

// ─── Verification de la connexion ─────────────────────────────────────────────

async function verifyConnection(client) {
  try {
    const result = await client.query('SELECT version()');
    logSuccess('Connecte a PostgreSQL: ' + result.rows[0].version.substring(0, 50) + '...');

    // Verifier les donnees existantes
    const containerCount = await client.query('SELECT COUNT(*) FROM conteneur');
    const userCount = await client.query('SELECT COUNT(*) FROM utilisateur');
    const mesureCount = await client.query('SELECT COUNT(*) FROM mesure');

    logInfo(`  Conteneurs: ${containerCount.rows[0].count}`);
    logInfo(`  Utilisateurs: ${userCount.rows[0].count}`);
    logInfo(`  Mesures: ${mesureCount.rows[0].count}`);

    return {
      containers: parseInt(containerCount.rows[0].count),
      users: parseInt(userCount.rows[0].count),
      mesures: parseInt(mesureCount.rows[0].count),
    };
  } catch (err) {
    logError('Erreur de connexion: ' + err.message);
    throw err;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const doSeed = args.includes('--seed') || args.includes('--full');
  const doAvant = args.includes('--avant') || args.includes('--full');
  const doApres = args.includes('--apres') || args.includes('--full');
  const doCompare = args.includes('--compare');
  const doSeedOnly = args.includes('--seed-only');
  const doOptimOnly = args.includes('--optim-only');
  const doAll = args.length === 0 || args.includes('--full');

  if (doAll) {
    // Default: full benchmark with seed + avant + optim + apres
    const cliArgs = ['--full'];
  }

  logInfo('═══════════════════════════════════════════════════════════════');
  logInfo('  ECOTRACK - Performance Benchmark');
  logInfo('  Cibles: 2000 conteneurs, 15k users, 400 msg/min, 500 concurrents');
  logInfo('═══════════════════════════════════════════════════════════════\n');

  const client = createClient();
  await client.connect();

  try {
    const counts = await verifyConnection(client);

    // Seed data if needed
    if (doSeed || doSeedOnly || doAll) {
      await seedTargetData(client);
    }

    if (doOptimOnly) {
      await applyOptimizations(client);
      logSuccess('Optimisations appliquees');
      return;
    }

    // ─── BENCHMARK AVANT ────────────────────────────────────────────
    let avantResults = null;
    let apresResults = null;

    if (doAvant || doAll) {
      logInfo('\n═════════════════════════════════════════════════════');
      logInfo('  PHASE 1: BENCHMARK AVANT OPTIMISATION');
      logInfo('═════════════════════════════════════════════════════\n');

      const queries = await runQueryBenchmark(client, 'AVANT');
      const inserts = await runInsertBenchmark(client, 'AVANT');
      const concurrent = await runConcurrentBenchmark('AVANT');
      const stats = await runStatsBenchmark(client, 'AVANT');

      avantResults = { queries, inserts, concurrent, stats };

      logInfo('\n✅ Benchmark AVANT termine');
    }

    // ─── APPLY OPTIMIZATIONS ────────────────────────────────────────
    if ((doApres || doAll) && (doAvant || doAll)) {
      const optimized = await applyOptimizations(client);

      if (!optimized) {
        logWarning('Optimisations non appliquees, verification requise');
      }
    }

    // ─── BENCHMARK APRES ────────────────────────────────────────────
    if (doApres || doAll) {
      logInfo('\n═════════════════════════════════════════════════════');
      logInfo('  PHASE 2: BENCHMARK APRES OPTIMISATION');
      logInfo('═════════════════════════════════════════════════════\n');

      const queries = await runQueryBenchmark(client, 'APRES');
      const inserts = await runInsertBenchmark(client, 'APRES');
      const concurrent = await runConcurrentBenchmark('APRES');
      const stats = await runStatsBenchmark(client, 'APRES');

      apresResults = { queries, inserts, concurrent, stats };

      logInfo('\n✅ Benchmark APRES termine');
    }

    // ─── GENERATE REPORT ────────────────────────────────────────────
    if (avantResults && apresResults) {
      await generateReport(avantResults, apresResults);
    } else if (avantResults) {
      logInfo('\nRapport AVANT seul disponible. Appliquez --apres pour comparer.');
      // Save intermediate result
      const now = new Date().toISOString();
      const reportsDir = path.resolve(__dirname, '../../reports');
      if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
      fs.writeFileSync(
        path.join(reportsDir, `benchmark-avant-${now.replace(/[:.]/g, '-')}.json`),
        JSON.stringify({ date: now, avant: avantResults }, null, 2),
        'utf-8'
      );
    } else if (apresResults) {
      logInfo('\nBenchmark APRES uniquement. Utilisez --compare avec un rapport AVANT.');
    }

  } catch (err) {
    logError('Erreur fatale: ' + err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await client.end();
  }

  logInfo('\n═══════════════════════════════════════════════════════════════');
  logInfo('  BENCHMARK TERMINE');
  logInfo('═══════════════════════════════════════════════════════════════');
}

main();
