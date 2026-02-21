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

const logger = require('./src/utils/logger');

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
  logger.info('Test complet - Service Containers');

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await makeRequest(test.method, test.path);
      
      if (result.statusCode === test.expectedStatus) {
        logger.info({ statusCode: result.statusCode }, `PASS ${test.name}`);
        if (result.data && typeof result.data === 'object') {
          logger.info({
            preview: JSON.stringify(result.data).substring(0, 100)
          }, 'Response preview');
        }
        passed++;
      } else {
        logger.warn({
          expected: test.expectedStatus,
          received: result.statusCode
        }, `FAIL ${test.name}`);
        failed++;
      }
    } catch (error) {
      logger.error({ error: error.message }, `ERROR ${test.name}`);
      failed++;
    }
    
    // Petit délai entre les tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  logger.info({ passed, failed, total: passed + failed }, 'Resultats');

  if (failed === 0) {
    logger.info('Tous les tests ont reussi');
  } else {
    logger.warn('Certains tests ont echoue. Verifiez que le service est demarre');
  }
}

// Exécution
logger.info({ baseUrl: BASE_URL, port: PORT }, 'Demarrage des tests');
runTests().catch((error) => {
  logger.error({ error: error.message }, 'Tests failed');
});
