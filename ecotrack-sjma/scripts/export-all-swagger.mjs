/**
 * export-all-swagger.mjs
 * Génère un fichier HTML Redoc statique pour chaque microservice EcoTrack.
 * Usage : node scripts/export-all-swagger.mjs
 * Sortie : docs/swagger/<service>.html
 */

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'docs', 'swagger');
mkdirSync(outDir, { recursive: true });

// ─── Service definitions ─────────────────────────────────────────────────────

const services = [
  // ESM — exports unifiedSwaggerSpec directly
  {
    label: 'api-gateway',
    title: 'EcoTrack — API Unifiée (Gateway)',
    port: 3000,
    dir: join(root, 'services', 'api-gateway'),
    type: 'esm-named',
    specFile: './src/swagger-config.js',
    exportName: 'unifiedSwaggerSpec',
  },
  // ESM — default export from config/swagger.js
  {
    label: 'service-users',
    title: 'EcoTrack — Service Users',
    port: 3010,
    dir: join(root, 'services', 'service-users'),
    type: 'esm-default',
    specFile: './src/config/swagger.js',
  },
  // CJS — swagger-jsdoc inline
  {
    label: 'service-containers',
    title: 'EcoTrack — Service Containers',
    port: 3011,
    dir: join(root, 'services', 'service-containers'),
    type: 'cjs',
    swaggerOptions: {
      definition: {
        openapi: '3.0.0',
        info: { title: 'EcoTrack Containers API', version: '1.0.0', description: 'API professionnelle pour la gestion des conteneurs écologiques' },
        servers: [{ url: 'http://localhost:3011/api', description: 'Development server' }],
        components: { schemas: { Error: { type: 'object', properties: { success: { type: 'boolean' }, statusCode: { type: 'integer' }, message: { type: 'string' } } } } },
      },
      apis: ['./src/routes/*.js', './routes/*.js'],
    },
  },
  {
    label: 'service-routes',
    title: 'EcoTrack — Service Routes',
    port: 3012,
    dir: join(root, 'services', 'service-routes'),
    type: 'cjs',
    swaggerOptions: {
      definition: {
        openapi: '3.0.0',
        info: { title: 'EcoTrack Routes API', version: '1.0.0', description: 'API de gestion des tournées de collecte' },
        servers: [{ url: 'http://localhost:3012/api/V1/routes', description: 'Development server' }],
        components: { schemas: { Error: { type: 'object', properties: { success: { type: 'boolean' }, statusCode: { type: 'integer' }, message: { type: 'string' } } } } },
      },
      apis: ['./src/routes/tournee.route.js', './src/routes/collecte.route.js', './src/routes/vehicule.route.js'],
    },
  },
  {
    label: 'service-iot',
    title: 'EcoTrack — Service IoT',
    port: 3013,
    dir: join(root, 'services', 'service-iot'),
    type: 'cjs',
    swaggerOptions: {
      definition: {
        openapi: '3.0.0',
        info: { title: 'EcoTrack IoT Service API', version: '1.0.0', description: 'API pour la réception et le traitement des données capteurs IoT' },
        servers: [{ url: 'http://localhost:3013/api', description: 'Development server' }],
        components: { schemas: { Error: { type: 'object', properties: { success: { type: 'boolean' }, statusCode: { type: 'integer' }, message: { type: 'string' } } } } },
      },
      apis: ['./src/routes/*.js'],
    },
  },
  // ESM — default export from config/swagger.js
  {
    label: 'service-gamifications',
    title: 'EcoTrack — Service Gamification',
    port: 3014,
    dir: join(root, 'services', 'service-gamifications'),
    type: 'esm-default',
    specFile: './src/config/swagger.js',
  },
  {
    label: 'service-analytics',
    title: 'EcoTrack — Service Analytics',
    port: 3015,
    dir: join(root, 'services', 'service-analytics'),
    type: 'cjs',
    swaggerOptions: {
      definition: {
        openapi: '3.0.0',
        info: { title: 'EcoTrack Analytics API', version: '1.0.0', description: 'Service Analytics — Données agrégées et statistiques' },
        servers: [{ url: 'http://localhost:3015', description: 'Development server' }],
        components: {
          securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
          schemas: {
            Prediction: { type: 'object', properties: { containerId: { type: 'integer' }, currentFillLevel: { type: 'number' }, predictedFillLevel: { type: 'number' }, daysAhead: { type: 'integer' }, confidence: { type: 'integer' }, weatherImpact: { type: 'number' } } },
            Anomaly: { type: 'object', properties: { containerId: { type: 'integer' }, anomaliesCount: { type: 'integer' }, anomaliesRate: { type: 'string' }, statistics: { type: 'object' } } },
            DefectiveSensor: { type: 'object', properties: { containerId: { type: 'integer' }, containerUid: { type: 'string' }, issues: { type: 'array', items: { type: 'string' } } } },
          },
        },
        security: [{ bearerAuth: [] }],
      },
      apis: ['./src/routes/*.js'],
    },
  },
  {
    label: 'service-notifications',
    title: 'EcoTrack — Service Notifications',
    port: 3016,
    dir: join(root, 'services', 'service-notification-gestionnaire-admin'),
    type: 'cjs',
    swaggerOptions: {
      definition: {
        openapi: '3.0.0',
        info: { title: 'EcoTrack — Notifications Admin-Gestionnaire API', version: '1.0.0', description: 'API de gestion des notifications pour les gestionnaires de zones EcoTrack' },
        servers: [{ url: 'http://localhost:3016/api', description: 'Development server' }],
        components: {
          securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
          schemas: {
            Error: { type: 'object', properties: { success: { type: 'boolean' }, statusCode: { type: 'integer' }, message: { type: 'string' } } },
            Notification: { type: 'object', properties: { id_notification: { type: 'integer' }, id_utilisateur: { type: 'integer' }, type: { type: 'string', enum: ['ALERTE', 'TOURNEE', 'BADGE', 'SYSTEME'] }, titre: { type: 'string' }, corps: { type: 'string' }, est_lu: { type: 'boolean' }, date_creation: { type: 'string', format: 'date-time' } } },
            AdminNotification: { type: 'object', properties: { id_notification: { type: 'integer' }, id_utilisateur: { type: 'integer' }, type: { type: 'string', enum: ['ADMIN_ALERTE','ADMIN_SERVICE','ADMIN_SEUIL','ADMIN_ML','ADMIN_SECURITE','ADMIN_PERFORMANCE','ADMIN_IOT'] }, titre: { type: 'string' }, corps: { type: 'string' }, priorite: { type: 'integer' }, est_lu: { type: 'boolean' }, date_creation: { type: 'string', format: 'date-time' } } },
          },
        },
      },
      apis: ['./src/routes/*.js'],
    },
  },
];

// ─── Spec generation helpers ──────────────────────────────────────────────────

function generateCjsSpec(svc) {
  const opts = JSON.stringify(svc.swaggerOptions);
  const code = `const s=require('swagger-jsdoc')(${opts});process.stdout.write(JSON.stringify(s));`;
  const result = execSync(`node -e "${code.replace(/"/g, '\\"')}"`, { cwd: svc.dir });
  return JSON.parse(result.toString());
}

function generateEsmSpec(svc) {
  let code;
  if (svc.type === 'esm-default') {
    code = `import('${svc.specFile}').then(m=>process.stdout.write(JSON.stringify(m.default)));`;
  } else {
    code = `import('${svc.specFile}').then(m=>process.stdout.write(JSON.stringify(m.${svc.exportName})));`;
  }
  const result = execSync(`node --input-type=module -e "${code}"`, { cwd: svc.dir });
  return JSON.parse(result.toString());
}

// ─── Main loop ────────────────────────────────────────────────────────────────

const results = [];

for (const svc of services) {
  process.stdout.write(`\n⏳ ${svc.label} (port ${svc.port})... `);
  try {
    let spec;
    if (svc.type === 'cjs') {
      spec = generateCjsSpec(svc);
    } else {
      spec = generateEsmSpec(svc);
    }

    const jsonPath = join(outDir, `${svc.label}.json`);
    const htmlPath = join(outDir, `${svc.label}.html`);

    writeFileSync(jsonPath, JSON.stringify(spec, null, 2));

    execSync(
      `npx --yes @redocly/cli build-docs "${jsonPath}" -o "${htmlPath}" --title "${svc.title}" --disableGoogleFont 2>&1`,
      { cwd: root }
    );

    const paths = Object.keys(spec.paths || {}).length;
    process.stdout.write(`✅ ${paths} endpoints → docs/swagger/${svc.label}.html\n`);
    results.push({ label: svc.label, port: svc.port, title: svc.title, paths, ok: true });
  } catch (err) {
    process.stdout.write(`❌ ERREUR\n`);
    console.error(`  ${err.message.split('\n')[0]}`);
    results.push({ label: svc.label, port: svc.port, title: svc.title, paths: 0, ok: false });
  }
}

// ─── Index HTML ───────────────────────────────────────────────────────────────

const indexHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EcoTrack — Documentation API</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 4rem auto; padding: 0 1.5rem; color: #1a1a1a; }
    h1 { color: #166534; font-size: 1.8rem; margin-bottom: 0.25rem; }
    p.sub { color: #6b7280; margin-top: 0; }
    ul { list-style: none; padding: 0; display: grid; gap: 0.75rem; margin-top: 2rem; }
    li a { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; text-decoration: none; color: inherit; transition: border-color 0.15s, box-shadow 0.15s; }
    li a:hover { border-color: #166534; box-shadow: 0 0 0 3px #dcfce7; }
    .port { background: #dcfce7; color: #166534; font-weight: 700; font-size: 0.8rem; padding: 0.2rem 0.5rem; border-radius: 0.25rem; min-width: 3.5rem; text-align: center; }
    .title { font-weight: 600; }
    .paths { margin-left: auto; color: #9ca3af; font-size: 0.85rem; }
    .fail { opacity: 0.4; cursor: not-allowed; pointer-events: none; }
    footer { margin-top: 3rem; color: #9ca3af; font-size: 0.8rem; }
  </style>
</head>
<body>
  <h1>EcoTrack — Documentation API</h1>
  <p class="sub">Documentation statique générée le ${new Date().toLocaleDateString('fr-FR')} • Ouvrir un fichier pour voir tous les endpoints</p>
  <ul>
    ${results.map(r => `
    <li>
      <a href="./${r.label}.html" ${r.ok ? '' : 'class="fail"'}>
        <span class="port">:${r.port}</span>
        <span class="title">${r.title}</span>
        <span class="paths">${r.ok ? `${r.paths} endpoints` : 'erreur'}</span>
      </a>
    </li>`).join('')}
  </ul>
  <footer>Générée avec @redocly/cli — <code>node scripts/export-all-swagger.mjs</code></footer>
</body>
</html>`;

writeFileSync(join(outDir, 'index.html'), indexHtml);

console.log('\n\n📁 Fichiers générés dans docs/swagger/');
console.log(`   index.html   ← ouvrir ici pour naviguer entre les services`);
results.forEach(r => {
  if (r.ok) console.log(`   ${r.label}.html  (${r.paths} endpoints)`);
});
