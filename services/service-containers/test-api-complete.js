/**
 * Test Manuel Complet - Service Containers
 * 
 * Ce script teste toutes les fonctionnalités de l'API
 * Usage: node test-api-complete.js
 */

const http = require('http');

const BASE_URL = 'localhost';
const PORT = 3011;
const API_PREFIX = '/api';

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Fonction pour faire une requête HTTP
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const response = body ? JSON.parse(body) : null;
          resolve({ statusCode: res.statusCode, data: response });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Tests
const tests = [
  {
    name: 'Health Check',
    method: 'GET',
    path: '/health',
    expectedStatus: 200
  },
  {
    name: 'API Documentation',
    method: 'GET',
    path: '/api-docs',
    expectedStatus: 200
  },
  {
    name: 'Stats Dashboard',
    method: 'GET',
    path: `${API_PREFIX}/stats/dashboard`,
    expectedStatus: 200
  },
  {
    name: 'Stats Globales',
    method: 'GET',
    path: `${API_PREFIX}/stats`,
    expectedStatus: 200
  },
  {
    name: 'Distribution Niveaux Remplissage',
    method: 'GET',
    path: `${API_PREFIX}/stats/fill-levels`,
    expectedStatus: 200
  },
  {
    name: 'Stats par Zone',
    method: 'GET',
    path: `${API_PREFIX}/stats/by-zone`,
    expectedStatus: 200
  },
  {
    name: 'Stats par Type',
    method: 'GET',
    path: `${API_PREFIX}/stats/by-type`,
    expectedStatus: 200
  },
  {
    name: 'Alertes Actives',
    method: 'GET',
    path: `${API_PREFIX}/stats/alerts`,
    expectedStatus: 200
  },
  {
    name: 'Conteneurs Critiques',
    method: 'GET',
    path: `${API_PREFIX}/stats/critical`,
    expectedStatus: 200
  },
  {
    name: 'Stats Collecte',
    method: 'GET',
    path: `${API_PREFIX}/stats/collections`,
    expectedStatus: 200
  },
  {
    name: 'Stats Maintenance',
    method: 'GET',
    path: `${API_PREFIX}/stats/maintenance`,
    expectedStatus: 200
  },
  {
    name: 'Liste Conteneurs',
    method: 'GET',
    path: `${API_PREFIX}/containers`,
    expectedStatus: 200
  },
  {
    name: 'Liste Zones',
    method: 'GET',
    path: `${API_PREFIX}/zones`,
    expectedStatus: 200
  },
  {
    name: 'Liste Types Conteneurs',
    method: 'GET',
    path: `${API_PREFIX}/typecontainers`,
    expectedStatus: 200
  }
];

// Fonction principale
async function runTests() {
  console.log(`${colors.cyan}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║  Test Complet - Service Containers     ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════╝${colors.reset}\n`);

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await makeRequest(test.method, test.path);
      
      if (result.statusCode === test.expectedStatus) {
        console.log(`${colors.green}✓${colors.reset} ${test.name} ${colors.blue}(${result.statusCode})${colors.reset}`);
        if (result.data && typeof result.data === 'object') {
          console.log(`  ${colors.cyan}→${colors.reset} ${JSON.stringify(result.data).substring(0, 100)}...`);
        }
        passed++;
      } else {
        console.log(`${colors.red}✗${colors.reset} ${test.name} ${colors.red}(Expected ${test.expectedStatus}, got ${result.statusCode})${colors.reset}`);
        failed++;
      }
    } catch (error) {
      console.log(`${colors.red}✗${colors.reset} ${test.name} ${colors.red}(Error: ${error.message})${colors.reset}`);
      failed++;
    }
    
    // Petit délai entre les tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n${colors.cyan}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║  Résultats                             ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════╝${colors.reset}`);
  console.log(`${colors.green}Réussis:${colors.reset} ${passed}`);
  console.log(`${colors.red}Échoués:${colors.reset} ${failed}`);
  console.log(`${colors.yellow}Total:${colors.reset} ${passed + failed}\n`);

  if (failed === 0) {
    console.log(`${colors.green}🎉 Tous les tests ont réussi !${colors.reset}\n`);
  } else {
    console.log(`${colors.yellow}⚠️  Certains tests ont échoué. Vérifiez que le service est démarré.${colors.reset}\n`);
  }
}

// Exécution
console.log(`${colors.yellow}Démarrage des tests sur ${BASE_URL}:${PORT}...${colors.reset}\n`);
runTests().catch(console.error);
