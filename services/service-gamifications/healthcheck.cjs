const http = require('http');

const port = process.env.GAMIFICATIONS_PORT || process.env.PORT || 3014;

const req = http.request(
  {
    host: '127.0.0.1',
    port,
    path: '/health',
    timeout: 3000
  },
  (res) => {
    if (res.statusCode === 200) {
      process.exit(0);
    } else if (res.statusCode === 503) {
      console.error('Health check failed: Service Unavailable (503)');
      process.exit(1);
    } else {
      console.error(`Health check failed: status code ${res.statusCode}`);
      process.exit(1);
    }
  }
);

req.on('error', () => process.exit(1));
req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});
req.end();
