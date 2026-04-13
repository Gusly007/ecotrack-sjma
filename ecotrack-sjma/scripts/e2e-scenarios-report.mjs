/**
 * This script performs end-to-end (E2E) testing of the EcoTrack microservices by starting each service, running a series of predefined scenarios against their APIs, and generating a comprehensive report in Markdown, JSON, and HTML formats.
 *  The report includes the status of each scenario, pass/fail results, and overall metrics such as total scenarios, passed, failed, and pass rate.
 * 
 * Usage: Run this script from the root of the project using Node.js. It will automatically start the services, execute the scenarios, and output the report in the 'reports/e2e' directory.
 * 
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import http from 'node:http';
import https from 'node:https';
import { join } from 'node:path';

const rootDir = process.cwd();
const outDir = join(rootDir, 'reports', 'e2e');
const mdPath = join(outDir, 'report.md');
const jsonPath = join(outDir, 'report.json');
const htmlPath = join(outDir, 'index.html');

const services = [
  { name: 'service-users', cwd: join(rootDir, 'services', 'service-users'), entry: 'src/index.js', port: 3310, env: { PORT: '3310', NODE_ENV: 'test', INTEGRATION_SMOKE: 'true' } },
  { name: 'service-containers', cwd: join(rootDir, 'services', 'service-containers'), entry: 'index.js', port: 3311, env: { APP_PORT: '3311', NODE_ENV: 'test', INTEGRATION_SMOKE: 'true' } },
  { name: 'service-routes', cwd: join(rootDir, 'services', 'service-routes'), entry: 'index.js', port: 3312, env: { APP_PORT: '3312', NODE_ENV: 'test', INTEGRATION_SMOKE: 'true' } },
  { name: 'service-iot', cwd: join(rootDir, 'services', 'service-iot'), entry: 'index.js', port: 3313, env: { APP_PORT: '3313', NODE_ENV: 'test', INTEGRATION_SMOKE: 'true' } },
  { name: 'service-gamifications', cwd: join(rootDir, 'services', 'service-gamifications'), entry: 'src/index.js', port: 3314, env: { GAMIFICATIONS_PORT: '3314', NODE_ENV: 'test', INTEGRATION_SMOKE: 'true' } },
  { name: 'service-analytics', cwd: join(rootDir, 'services', 'service-analytics'), entry: 'src/index.js', port: 3315, env: { PORT: '3315', NODE_ENV: 'test', INTEGRATION_SMOKE: 'true' } },
  {
    name: 'api-gateway',
    cwd: join(rootDir, 'services', 'api-gateway'),
    entry: 'src/index.js',
    port: 3316,
    env: {
      GATEWAY_PORT: '3316', USERS_PORT: '3310', CONTAINERS_PORT: '3311', ROUTES_PORT: '3312', IOT_PORT: '3313',
      GAMIFICATIONS_PORT: '3314', ANALYTICS_PORT: '3315', NODE_ENV: 'test', INTEGRATION_SMOKE: 'true'
    }
  }
];

const scenarios = [
  { name: 'Users health', url: 'http://127.0.0.1:3310/health', expectedStatus: 200 },
  { name: 'Containers API root', url: 'http://127.0.0.1:3311/api', expectedStatus: 200 },
  { name: 'Routes API root', url: 'http://127.0.0.1:3312/api/routes', expectedStatus: 200 },
  { name: 'IoT API root', url: 'http://127.0.0.1:3313/api', expectedStatus: 200 },
  { name: 'Gamifications health', url: 'http://127.0.0.1:3314/health', expectedStatus: 200 },
  { name: 'Analytics health', url: 'http://127.0.0.1:3315/health', expectedStatus: 200 },
  { name: 'Gateway docs', url: 'http://127.0.0.1:3316/api-docs/', expectedStatus: 200 },
  { name: 'Gateway health', url: 'http://127.0.0.1:3316/health', expectedStatus: 200 }
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function request(urlString, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlString);
    const client = u.protocol === 'https:' ? https : http;
    const req = client.request({ protocol: u.protocol, hostname: u.hostname, port: u.port, path: `${u.pathname}${u.search}`, method: 'GET', timeout: timeoutMs }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode || 0, body: Buffer.concat(chunks).toString('utf8').slice(0, 400) }));
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
    req.end();
  });
}

async function waitForHealth(url, timeoutMs = 45000) {
  const started = Date.now();
  let last = null;
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await request(url, 4000);
      if (res.status >= 200 && res.status < 300) return true;
      last = new Error(`status ${res.status}`);
    } catch (e) {
      last = e;
    }
    await sleep(500);
  }
  throw last || new Error('health timeout');
}

async function stopChild(child) {
  if (!child || child.killed) return;
  child.kill('SIGTERM');
  await Promise.race([new Promise((resolve) => child.once('exit', resolve)), sleep(3000)]);
  if (!child.killed) child.kill('SIGKILL');
}

async function startServices() {
  const children = [];
  for (const s of services) {
    const child = spawn(process.execPath, [s.entry], { cwd: s.cwd, env: { ...process.env, ...s.env }, stdio: ['ignore', 'pipe', 'pipe'] });
    children.push({ name: s.name, child });
    await waitForHealth(`http://127.0.0.1:${s.port}/health`);
  }
  return children;
}

function pct(a, b) {
  return b === 0 ? 0 : Number(((a / b) * 100).toFixed(1));
}

function escapeHtml(v) {
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildMarkdown(result) {
  const lines = [
    '# E2E Scenario Report',
    '',
    `Generated at: ${result.generatedAt}`,
    `Total scenarios: ${result.total}`,
    `Passed: ${result.passed}`,
    `Failed: ${result.failed}`,
    `Pass rate: ${result.passRate}%`,
    '',
    '| Scenario | Result | HTTP |',
    '|---|---:|---:|'
  ];
  for (const s of result.scenarios) {
    lines.push(`| ${s.name} | ${s.passed ? 'PASS' : 'FAIL'} | ${s.status ?? 'N/A'} |`);
  }
  return lines.join('\n');
}

function buildHtml(result) {
  const rows = result.scenarios.map((s) => `<tr><td>${escapeHtml(s.name)}</td><td class="${s.passed ? 'ok' : 'ko'}">${s.passed ? 'PASS' : 'FAIL'}</td><td>${escapeHtml(s.status ?? 'N/A')}</td></tr>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>E2E Report</title><style>body{font-family:Segoe UI,Arial,sans-serif;padding:24px;background:#f7fafc;color:#0f172a}.kpi{display:flex;gap:12px}.card{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:10px 14px}.ok{color:#166534;font-weight:700}.ko{color:#991b1b;font-weight:700}table{width:100%;border-collapse:collapse;background:#fff;margin-top:12px}th,td{padding:10px;border:1px solid #e2e8f0;text-align:left}</style></head><body><h1>E2E Scenario Report</h1><div class="kpi"><div class="card">Total ${result.total}</div><div class="card ok">Passed ${result.passed}</div><div class="card ko">Failed ${result.failed}</div><div class="card">Pass rate ${result.passRate}%</div></div><table><thead><tr><th>Scenario</th><th>Result</th><th>HTTP</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
}

async function main() {
  let children = [];
  try {
    children = await startServices();
    const scenarioResults = [];
    for (const s of scenarios) {
      try {
        const res = await request(s.url, 6000);
        scenarioResults.push({ name: s.name, status: res.status, passed: res.status === s.expectedStatus, body: res.body });
      } catch (e) {
        scenarioResults.push({ name: s.name, status: null, passed: false, error: String(e.message || e) });
      }
    }

    const passed = scenarioResults.filter((s) => s.passed).length;
    const total = scenarioResults.length;
    const result = {
      generatedAt: new Date().toISOString(),
      total,
      passed,
      failed: total - passed,
      passRate: pct(passed, total),
      scenarios: scenarioResults
    };

    await mkdir(outDir, { recursive: true });
    await writeFile(mdPath, buildMarkdown(result), 'utf8');
    await writeFile(jsonPath, JSON.stringify(result, null, 2), 'utf8');
    await writeFile(htmlPath, buildHtml(result), 'utf8');

    console.log(`E2E report written to ${htmlPath}`);
    if (result.failed > 0) process.exitCode = 1;
  } finally {
    await Promise.all(children.map((c) => stopChild(c.child)));
  }
}

main().catch((err) => {
  console.error('E2E scenario run failed:', err);
  process.exit(1);
});
