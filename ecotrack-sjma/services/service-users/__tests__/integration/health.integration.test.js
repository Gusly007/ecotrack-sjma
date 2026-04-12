/**
 * This integration test suite verifies the health endpoints of the service-users microservice.
 *  It checks that the /health endpoint returns a status of 'ok' and that the /health/db endpoint confirms that the database is reachable.
 *  The tests are designed to run in a test environment, ensuring that they do not interfere with production data or services.
 */
const { describe, it, expect, beforeAll, afterAll } = require('@jest/globals');

process.env.DISABLE_AUTO_START = 'true';
process.env.NODE_ENV = 'test';

let app;
let dbPool;
let server;
let baseUrl;

beforeAll(async () => {
  ({ default: app } = await import('../../src/index.js'));
  ({ default: dbPool } = await import('../../src/config/database.js'));

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const address = server.address();
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  if (dbPool?.end) {
    await dbPool.end();
  }
});

describe('service-users integration', () => {
  it('returns ok on the health endpoint', async () => {
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ status: 'ok', service: 'users' });
  });

  it('returns db health when postgres is reachable', async () => {
    const response = await fetch(`${baseUrl}/health/db`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ status: 'ok', db: 'up' });
  });
});
