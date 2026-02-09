import http from 'http';

const port = process.env.GAMIFICATIONS_PORT || process.env.PORT || 3014;

const req = http.request(
  {
    host: '127.0.0.1',
    port,
    path: '/health',
    timeout: 3000
  },
  (res) => {
    const ok = res.statusCode && res.statusCode >= 200 && res.statusCode < 400;
    process.exit(ok ? 0 : 1);
  }
);

req.on('error', () => process.exit(1));
req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});
req.end();
