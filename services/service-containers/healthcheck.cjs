// ============================================================================
// HEALTHCHECK - SERVICE CONTAINERS
// ============================================================================
// Script de healthcheck pour Docker
// Vérifie que le service répond correctement
// ============================================================================

const http = require('http');

const options = {
  host: 'localhost',
  port: process.env.APP_PORT || 3011,
  path: '/health',
  timeout: 2000
};

const healthCheck = http.request(options, (res) => {
  console.log(`HEALTHCHECK STATUS: ${res.statusCode}`);
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

healthCheck.on('error', (err) => {
  console.error('HEALTHCHECK ERROR:', err.message);
  process.exit(1);
});

healthCheck.end();
