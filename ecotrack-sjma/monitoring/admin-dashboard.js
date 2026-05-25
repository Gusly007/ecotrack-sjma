/**
 * Admin Dashboard - Monitoring Terminal
 * 
 * Affiche le statut des services en temps réel avec :
 * - Vérification de la santé des services (UP/DOWN)
 * - Latence de chaque service
 * - Logging avec Pino
 * - Auto-refresh toutes les 10s
 * 
 * Usage: node admin-dashboard.js
 */

const http = require('http');
const path = require('path');
const pino = require('pino');

const LOG_DIR = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, `dashboard-${new Date().toISOString().split('T')[0]}.log`);

const logger = pino({
    level: 'debug',
    transport: {
        targets: [
            {
                target: 'pino/file',
                options: { destination: 1 }
            },
            {
                target: 'pino/file',
                options: { 
                    destination: LOG_FILE,
                    mkdir: true
                }
            }
        ]
    }
});

const services = [
    { name: 'API Gateway', url: 'http://localhost:3000/health', port: 3000 },
    { name: 'Service Users', url: 'http://localhost:3010/health', port: 3010 },
    { name: 'Service Containers', url: 'http://localhost:3011/health', port: 3011 },
    { name: 'Service Gamifications', url: 'http://localhost:3014/health', port: 3014 },
    { name: 'Prometheus', url: 'http://localhost:9090/-/healthy', port: 9090 },
    { name: 'Grafana', url: 'http://localhost:3001/api/V1/health', port: 3001 }
];

function checkService(service) {
    return new Promise((resolve) => {
        const start = Date.now();
        http.get(service.url, (res) => {
            const latency = Date.now() - start;
            const status = res.statusCode < 400 ? 'UP' : 'DOWN';
            resolve({ name: service.name, port: service.port, status, latency });
        }).on('error', () => {
            resolve({ name: service.name, port: service.port, status: 'DOWN', latency: 0 });
        });
    });
}

async function dashboard() {
    console.clear();
    
    const results = await Promise.all(services.map(checkService));
    const upCount = results.filter(r => r.status === 'UP').length;
    const total = results.length;
    
    const summary = upCount === total ? '✓ TOUS OK' : `⚠ ${total - upCount} PROBLÈME(S)`;
    
    logger.info({ servicesUp: upCount, totalServices: total }, 'Dashboard refresh');
    
    console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                    ECOTRACK - MONITORING DASHBOARD                          ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`  📊 STATUT GLOBAL: ${upCount}/${total} services UP  [${summary}]`);
    console.log('');
    
    results.forEach(r => {
        if (r.status === 'DOWN') {
            logger.warn({ service: r.name, port: r.port }, 'Service DOWN détecté');
        }
    });
    
    console.log('┌──────────────────────────────────────────────────────────────────────────────┐');
    console.log('│  SERVICE                    PORT     STATUT    LATENCE                     │');
    console.log('├──────────────────────────────────────────────────────────────────────────────┤');
    
    results.forEach(r => {
        const statusIcon = r.status === 'UP' ? '✓ UP  ' : '✗ DOWN';
        const statusColor = r.status === 'UP' ? '\x1b[32m' : '\x1b[31m';
        const latencyColor = r.latency < 100 ? '\x1b[32m' : (r.latency < 500 ? '\x1b[33m' : '\x1b[31m');
        const latencyStr = r.status === 'UP' ? `${latencyColor}${r.latency}ms\x1b[0m` : '---';
        
        logger.debug({ service: r.name, status: r.status, latency: r.latency }, 'Service check');
        
        console.log(`  │ ${r.name.padEnd(26)} ${r.port}    ${statusColor}${statusIcon}\x1b[0m    ${latencyStr.padStart(8)}     │`);
    });
    
    console.log('└──────────────────────────────────────────────────────────────────────────────┘');
    console.log('');
    console.log('┌──────────────────────────────────────────────────────────────────────────────┐');
    console.log('│  LIENS RAPIDES                                                               │');
    console.log('├──────────────────────────────────────────────────────────────────────────────┤');
    console.log('│  🌐 API Gateway:  http://localhost:3000   │  📊 Prometheus: http://localhost:9090  │');
    console.log('│  👥 Service Users: http://localhost:3010    │  📈 Grafana:     http://localhost:3001  │');
    console.log('│  📦 Containers:    http://localhost:3011    │  🗄️  PgAdmin:    http://localhost:5050  │');
    console.log('└──────────────────────────────────────────────────────────────────────────────┘');
    console.log('');
    console.log('  🔄 Auto-refresh: 10s  |  Ctrl+C pour quitter');
    
    setTimeout(dashboard, 10000);
}

logger.info({ services: services.map(s => s.name) }, 'Admin Dashboard started');
dashboard();
