import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import express from 'express';
import jwt from 'jsonwebtoken';

// Le contrôle de rôle du gateway (V2-004) doit couvrir les mêmes chemins que
// le routeur Express. Express est insensible à la casse par défaut
// (`case sensitive routing = false`) : /api/v1/health/all est servi par la
// route /api/V1/health/all. Sans alignement, un AGENT ou un CITOYEN muni d'un
// token valide obtient 200 sur ces variantes et contourne la protection.

const JWT_SECRET = 'integration_test_secret';
process.env.JWT_SECRET = JWT_SECRET;

let server;
let baseUrl;
let jwtValidationMiddleware;

const MONITORING_PATHS = [
  '/api/V1/health/all',
  '/api/V1/metrics/status',
  '/api/V1/alerts',
  '/api/V1/dashboard/stats',
  '/api/V1/analytics',
  '/api/V1/iot/sensors/status',
];

const caseVariants = (path) => [
  path,
  path.toLowerCase(),
  path.toUpperCase(),
  path.replace('/api/V1/', '/api/v1/'),
  path.replace('/api/V1/', '/API/V1/'),
  path.replace('/api/V1/', '/Api/V1/'),
];

const signToken = (role, id = 1) =>
  jwt.sign({ id, role, type: 'access' }, JWT_SECRET, { expiresIn: '1h' });

const get = (path, token) =>
  fetch(`${baseUrl}${path}`, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });

beforeAll(async () => {
  ({ jwtValidationMiddleware } = await import('../../src/middleware/auth.js'));

  // Reproduit le montage réel : un `app.use(jwt)` global (le middleware reçoit
  // donc le chemin complet) puis les routes de monitoring déclarées avec leur
  // casse d'origine, servies par le routeur insensible à la casse d'Express.
  const app = express();
  app.use(jwtValidationMiddleware);

  for (const route of MONITORING_PATHS) {
    app.get(route, (req, res) => res.json({ ok: true, route }));
  }

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

afterAll(() => new Promise((resolve) => server.close(resolve)));

describe('monitoring admin : alignement casse routeur / contrôle de rôle (V2-004)', () => {
  const allPaths = MONITORING_PATHS.flatMap(caseVariants);

  it('sert bien les variantes de casse (le routeur Express est insensible à la casse)', async () => {
    const token = signToken('ADMIN', 1);

    for (const path of allPaths) {
      const response = await get(path, token);
      expect(response.status).toBe(200);
    }
  });

  it('refuse un AGENT avec 403 sur toutes les variantes de casse', async () => {
    const token = signToken('AGENT', 29);

    for (const path of allPaths) {
      const response = await get(path, token);
      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body).toMatchObject({ error: 'Forbidden' });
    }
  });

  it('refuse un CITOYEN avec 403 sur toutes les variantes de casse', async () => {
    const token = signToken('CITOYEN', 30);

    for (const path of allPaths) {
      const response = await get(path, token);
      expect(response.status).toBe(403);
    }
  });

  it('accepte un GESTIONNAIRE sur toutes les variantes de casse', async () => {
    const token = signToken('GESTIONNAIRE', 28);

    for (const path of allPaths) {
      const response = await get(path, token);
      expect(response.status).toBe(200);
    }
  });

  it('renvoie 401 sans token, quelle que soit la casse', async () => {
    for (const path of allPaths) {
      const response = await get(path);
      expect(response.status).toBe(401);
    }
  });
});
