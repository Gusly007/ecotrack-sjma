/**
 * Smoke test sécurité (hors Jest) pour service-users.
 *
 * Pré-requis:
 * - service-users lancé (ou via Gateway) + DB accessible (refresh tokens)
 * - BASE_URL défini si différent (ex: http://localhost:3000 pour la gateway)
 *
 * Usage:
 *   BASE_URL=http://localhost:3010 node scripts/security_smoke_test.mjs
 */

const argBaseUrl = process.argv.find((a) => a.startsWith('--baseUrl='))?.split('=')[1];
const BASE_URL = argBaseUrl || process.env.BASE_URL || 'http://localhost:3010';

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const requestJson = async (method, path, { body, headers } = {}) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(headers || {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  return { res, text, json };
};

const header = (res, name) => res.headers.get(name);

const run = async () => {
  console.log(`Running security smoke test against: ${BASE_URL}`);

  // 1) Health + Helmet headers
  {
    const { res, json, text } = await requestJson('GET', '/health');
    assert(res.status === 200, `Expected 200 on /health, got ${res.status}: ${text}`);
    assert(json?.status === 'ok', 'Expected JSON {status:"ok"} on /health');

    // If BASE_URL points to the gateway, /health is served by the gateway itself.
    // Helmet is installed on service-users, not necessarily on the gateway.
    const isGatewayHealth = Boolean(json?.gateway);
    if (!isGatewayHealth) {
      const nosniff = header(res, 'x-content-type-options');
      assert(nosniff === 'nosniff', `Expected x-content-type-options=nosniff, got ${nosniff}`);
    }
  }

  // 2) Validation (Zod) – register missing fields
  {
    const { res, json } = await requestJson('POST', '/auth/register', {
      body: { email: 'not-an-email' }
    });
    assert(res.status === 400, `Expected 400 on invalid register payload, got ${res.status}`);
    assert(json?.error === 'Validation error', 'Expected Validation error');
    assert(Array.isArray(json?.details), 'Expected details array');

    // Helmet headers should be present on responses coming from service-users,
    // including when accessed through the gateway proxy.
    const nosniff = header(res, 'x-content-type-options');
    assert(nosniff === 'nosniff', `Expected x-content-type-options=nosniff, got ${nosniff}`);
  }

  // 3) Register OK
  const email = `smoke_${Date.now()}@example.com`;
  const password = 'password123';
  const username = `smoke_${Date.now()}`;

  let accessToken;
  let refreshToken;

  {
    const { res, json, text } = await requestJson('POST', '/auth/register', {
      body: { email, username, password, role: 'CITOYEN' }
    });
    assert(res.status === 201, `Expected 201 on register, got ${res.status}: ${text}`);
    assert(typeof json?.token === 'string' && json.token.length > 10, 'Expected token string');
    assert(typeof json?.refreshToken === 'string' && json.refreshToken.length > 10, 'Expected refreshToken string');

    accessToken = json.token;
    refreshToken = json.refreshToken;
  }

  // 4) Protected endpoint requires auth
  {
    const { res } = await requestJson('GET', '/auth/profile');
    assert(res.status === 401 || res.status === 403, `Expected 401/403 without token, got ${res.status}`);
  }

  // 5) Protected endpoint OK
  {
    const { res, json, text } = await requestJson('GET', '/auth/profile', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    assert(res.status === 200, `Expected 200 on /auth/profile with token, got ${res.status}: ${text}`);
    assert(json?.data, 'Expected data in profile response');
  }

  // 6) Refresh -> new access token
  let newAccessToken;
  {
    const { res, json, text } = await requestJson('POST', '/auth/refresh', {
      body: { refreshToken }
    });
    assert(res.status === 200, `Expected 200 on refresh, got ${res.status}: ${text}`);
    assert(typeof json?.token === 'string' && json.token.length > 10, 'Expected new access token string');
    newAccessToken = json.token;
  }

  // 7) Logout -> revoke refresh token (best-effort test)
  {
    const { res, json, text } = await requestJson('POST', '/auth/logout', {
      headers: { Authorization: `Bearer ${newAccessToken}` },
      body: { refreshToken }
    });
    assert(res.status === 200, `Expected 200 on logout, got ${res.status}: ${text}`);
    assert(json?.message === 'Logged out successfully', 'Expected logout confirmation');
  }

  // 8) Refresh after logout should fail (revoked)
  {
    const { res } = await requestJson('POST', '/auth/refresh', {
      body: { refreshToken }
    });
    assert(res.status === 403, `Expected 403 on refresh after logout (revoked), got ${res.status}`);
  }

  console.log('OK: Security smoke test passed.');
};

run().catch((err) => {
  const message = err?.message || String(err);
  console.error('FAILED:', message);

  // Helpful details for fetch/network errors
  if (err?.cause) {
    const cause = err.cause;
    const code = cause?.code ? ` (code: ${cause.code})` : '';
    const syscall = cause?.syscall ? ` (syscall: ${cause.syscall})` : '';
    console.error('CAUSE:', (cause?.message || String(cause)) + code + syscall);
  }

  if (message.toLowerCase().includes('fetch failed')) {
    console.error(
      'HINT: make sure the service is running and BASE_URL is correct.\n' +
        `      Example (PowerShell): $env:BASE_URL='http://localhost:3000'; npm run test:smoke\n` +
        `      Or: node scripts/security_smoke_test.mjs --baseUrl=http://localhost:3000`
    );
  }

  process.exitCode = 1;
});
