const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const compose = JSON.parse(execFileSync('docker', [
  'compose', '-f', 'docker-compose.prod.yml', 'config', '--no-interpolate', '--format', 'json',
], { cwd: path.resolve(__dirname, '../..'), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
const { services } = compose;

test('le gateway cible Routes et partage le secret de vérification JWT', () => {
  assert.equal(services['api-gateway'].environment.ROUTES_SERVICE_URL, 'http://service-routes:3012');
  assert.equal(services['api-gateway'].environment.JWT_SECRET, services['service-users'].environment.JWT_SECRET);
  assert.equal(services['api-gateway'].depends_on['service-routes'].condition, 'service_healthy');
});

test('Routes cible le service de notifications et partage son secret interne', () => {
  const routes = services['service-routes'];
  const notifications = services['service-notification-gestionnaire-admin'];
  assert.equal(routes.environment.NOTIFICATION_SERVICE_URL, 'http://service-notification-gestionnaire-admin:3016');
  assert.equal(services['api-gateway'].environment.NOTIFICATION_SERVICE_URL, routes.environment.NOTIFICATION_SERVICE_URL);
  assert.equal(routes.environment.JWT_SECRET, '${JWT_SECRET}');
  assert.equal(notifications.environment.JWT_SECRET, routes.environment.JWT_SECRET);
  assert.equal(routes.depends_on['service-notification-gestionnaire-admin'].condition, 'service_healthy');
});

for (const name of ['service-routes', 'service-notification-gestionnaire-admin']) {
  test(`${name} attend les migrations et utilise Redis et la base configurée`, () => {
    const service = services[name];
    assert.equal(service.environment.DATABASE_URL, '${DATABASE_URL}');
    assert.equal(service.environment.REDIS_HOST, 'redis');
    assert.equal(String(service.environment.REDIS_PORT), '6379');
    assert.equal(service.depends_on.migrations.condition, 'service_completed_successfully');
    assert.equal(service.depends_on.redis.condition, 'service_started');
    assert.deepEqual(service.healthcheck.test, ['CMD', 'node', 'healthcheck.cjs']);
    assert.ok(Object.hasOwn(service.networks, 'ecotrack'));
    assert.equal(service.ports, undefined);
  });
}

test('Redis reste interne au réseau et dispose de son contrôle de santé', () => {
  assert.equal(services.redis.image, 'redis:7-alpine');
  assert.deepEqual(services.redis.healthcheck.test, ['CMD', 'redis-cli', 'ping']);
  assert.equal(services.redis.ports, undefined);
  assert.ok(Object.hasOwn(services.redis.networks, 'ecotrack'));
});
