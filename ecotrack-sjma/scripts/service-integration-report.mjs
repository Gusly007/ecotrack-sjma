/**
 * This script performs integration testing of the EcoTrack microservices by starting each service, checking their health endpoints, and generating a comprehensive report in Markdown, JSON, and HTML formats.
 *  The report includes the status of each service, pass/fail results, HTTP status codes, response snippets, and logs tail for debugging purposes.
 * 
 * Usage: Run this script from the root of the project using Node.js. It will automatically start the services, check their health, and output the report in the 'reports/integration' directory.
 * 
 * Note: The script assumes that each service has a /health endpoint that returns a 200 status code when healthy. Adjust the health check logic if your services use different endpoints or criteria for health.
 * 
 * The script also captures the last 20 lines of logs from each service during startup to help diagnose any issues that may arise during the health check.
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import http from 'node:http';
import https from 'node:https';
import { join } from 'node:path';

const rootDir = process.cwd();
const integrationReportDir = join(rootDir, 'reports', 'integration');
const reportMdPath = join(integrationReportDir, 'report.md');
const reportJsonPath = join(integrationReportDir, 'report.json');
const reportHtmlPath = join(integrationReportDir, 'index.html');

const services = [
  {
    name: 'service-users',
    cwd: join(rootDir, 'services', 'service-users'),
    entry: 'src/index.js',
    port: 3310,
    env: { PORT: '3310', NODE_ENV: 'test', INTEGRATION_SMOKE: 'true' }
  },
  {
    name: 'service-containers',
    cwd: join(rootDir, 'services', 'service-containers'),
    entry: 'index.js',
    port: 3311,
    env: { APP_PORT: '3311', NODE_ENV: 'test', INTEGRATION_SMOKE: 'true' }
  },
  {
    name: 'service-routes',
    cwd: join(rootDir, 'services', 'service-routes'),
    entry: 'index.js',
    port: 3312,
    env: { APP_PORT: '3312', NODE_ENV: 'test', INTEGRATION_SMOKE: 'true' }
  },
  {
    name: 'service-iot',
    cwd: join(rootDir, 'services', 'service-iot'),
    entry: 'index.js',
    port: 3313,
    env: { APP_PORT: '3313', NODE_ENV: 'test', INTEGRATION_SMOKE: 'true' }
  },
  {
    name: 'service-gamifications',
    cwd: join(rootDir, 'services', 'service-gamifications'),
    entry: 'src/index.js',
    port: 3314,
    env: { GAMIFICATIONS_PORT: '3314', NODE_ENV: 'test', INTEGRATION_SMOKE: 'true' }
  },
  {
    name: 'service-analytics',
    cwd: join(rootDir, 'services', 'service-analytics'),
    entry: 'src/index.js',
    port: 3315,
    env: { PORT: '3315', NODE_ENV: 'test', INTEGRATION_SMOKE: 'true' }
  },
  {
    name: 'api-gateway',
    cwd: join(rootDir, 'services', 'api-gateway'),
    entry: 'src/index.js',
    port: 3316,
    env: {
      GATEWAY_PORT: '3316',
      USERS_PORT: '3310',
      CONTAINERS_PORT: '3311',
      ROUTES_PORT: '3312',
      IOT_PORT: '3313',
      GAMIFICATIONS_PORT: '3314',
      ANALYTICS_PORT: '3315',
      NODE_ENV: 'test',
      INTEGRATION_SMOKE: 'true'
    }
  }
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealth(url, timeoutMs) {
  const start = Date.now();
  let lastError = null;

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await requestJson(url, 5000);
      return {
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        body: response.body.slice(0, 400)
      };
    } catch (error) {
      lastError = error;
      await sleep(500);
    }
  }

  return {
    ok: false,
    status: null,
    body: '',
    error: lastError ? String(lastError.message || lastError) : 'Health timeout'
  };
}

function requestJson(urlString, timeoutMs) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const client = url.protocol === 'https:' ? https : http;

    const request = client.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        path: `${url.pathname}${url.search}`,
        method: 'GET',
        timeout: timeoutMs
      },
      (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          resolve({
            status: response.statusCode || 0,
            body: Buffer.concat(chunks).toString('utf8')
          });
        });
      }
    );

    request.on('timeout', () => {
      request.destroy(new Error('Health request timeout'));
    });

    request.on('error', reject);
    request.end();
  });
}

async function stopProcess(child) {
  if (!child || child.killed) {
    return;
  }

  child.kill('SIGTERM');

  await Promise.race([
    new Promise((resolve) => child.once('exit', resolve)),
    sleep(4000)
  ]);

  if (!child.killed) {
    child.kill('SIGKILL');
  }
}

async function runServiceIntegration(service) {
  const startedAt = new Date().toISOString();
  const command = process.execPath;
  const args = [service.entry];
  const env = { ...process.env, ...service.env };

  const logs = [];
  const child = spawn(command, args, {
    cwd: service.cwd,
    env,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  child.stdout.on('data', (chunk) => {
    logs.push(String(chunk));
    if (logs.length > 20) logs.shift();
  });

  child.stderr.on('data', (chunk) => {
    logs.push(String(chunk));
    if (logs.length > 20) logs.shift();
  });

  const healthUrl = `http://127.0.0.1:${service.port}/health`;
  const checkStarted = Date.now();
  const health = await waitForHealth(healthUrl, 45000);
  const durationMs = Date.now() - checkStarted;

  const result = {
    service: service.name,
    healthUrl,
    startedAt,
    durationMs,
    status: health.status,
    passed: health.ok,
    responseSnippet: health.body,
    error: health.error || null,
    logsTail: logs.join('').slice(-1200)
  };

  await stopProcess(child);
  return result;
}

function buildMarkdown(results) {
  const generatedAt = new Date().toISOString();
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  const lines = [
    '# Integration Report - Services',
    '',
    `Generated at: ${generatedAt}`,
    '',
    `Total services tested: ${results.length}`,
    `Passed: ${passedCount}`,
    `Failed: ${failedCount}`,
    '',
    '| Service | Result | HTTP | Duration (ms) |',
    '|---|---:|---:|---:|'
  ];

  for (const result of results) {
    lines.push(`| ${result.service} | ${result.passed ? 'PASS' : 'FAIL'} | ${result.status ?? 'N/A'} | ${result.durationMs} |`);
  }

  lines.push('', '## Details', '');

  for (const result of results) {
    lines.push(`### ${result.service}`);
    lines.push(`- Result: ${result.passed ? 'PASS' : 'FAIL'}`);
    lines.push(`- Health URL: ${result.healthUrl}`);
    lines.push(`- HTTP Status: ${result.status ?? 'N/A'}`);
    lines.push(`- Duration: ${result.durationMs} ms`);

    if (result.error) {
      lines.push(`- Error: ${result.error}`);
    }

    if (result.responseSnippet) {
      lines.push('- Health response snippet:');
      lines.push('```text');
      lines.push(result.responseSnippet);
      lines.push('```');
    }

    if (result.logsTail) {
      lines.push('- Service logs tail:');
      lines.push('```text');
      lines.push(result.logsTail);
      lines.push('```');
    }

    lines.push('');
  }

  return lines.join('\n');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildHtml(results) {
  const generatedAt = new Date().toISOString();
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  const rows = results
    .map((result) => {
      const statusClass = result.passed ? 'pass' : 'fail';
      const statusLabel = result.passed ? 'PASS' : 'FAIL';
      return `
      <tr>
        <td>${escapeHtml(result.service)}</td>
        <td class="${statusClass}">${statusLabel}</td>
        <td>${escapeHtml(result.status ?? 'N/A')}</td>
        <td>${escapeHtml(result.durationMs)}</td>
      </tr>`;
    })
    .join('');

  const details = results
    .map((result) => {
      const statusClass = result.passed ? 'pass' : 'fail';
      const statusLabel = result.passed ? 'PASS' : 'FAIL';
      const errorBlock = result.error
        ? `<p><strong>Error:</strong> ${escapeHtml(result.error)}</p>`
        : '';
      const responseBlock = result.responseSnippet
        ? `<h4>Health response snippet</h4><pre>${escapeHtml(result.responseSnippet)}</pre>`
        : '';
      const logsBlock = result.logsTail
        ? `<h4>Service logs tail</h4><pre>${escapeHtml(result.logsTail)}</pre>`
        : '';

      return `
      <section class="card">
        <h3>${escapeHtml(result.service)} <span class="${statusClass}">${statusLabel}</span></h3>
        <p><strong>Health URL:</strong> ${escapeHtml(result.healthUrl)}</p>
        <p><strong>HTTP Status:</strong> ${escapeHtml(result.status ?? 'N/A')}</p>
        <p><strong>Duration:</strong> ${escapeHtml(result.durationMs)} ms</p>
        ${errorBlock}
        ${responseBlock}
        ${logsBlock}
      </section>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Integration Report - Services</title>
  <style>
    :root {
      --bg: #f6f8fb;
      --card: #ffffff;
      --text: #1f2937;
      --muted: #6b7280;
      --pass: #1b7f3b;
      --fail: #b42318;
      --border: #e5e7eb;
    }
    body {
      margin: 0;
      font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(180deg, #eef2ff 0%, var(--bg) 220px);
      color: var(--text);
    }
    .container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 24px;
    }
    h1 {
      margin-bottom: 4px;
    }
    .meta {
      color: var(--muted);
      margin-bottom: 20px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(3, minmax(120px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }
    .summary .card {
      padding: 14px;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: var(--card);
    }
    .summary .value {
      font-size: 22px;
      font-weight: 700;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 24px;
    }
    th, td {
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid var(--border);
    }
    th {
      background: #f9fafb;
    }
    .pass {
      color: var(--pass);
      font-weight: 700;
    }
    .fail {
      color: var(--fail);
      font-weight: 700;
    }
    .card {
      border: 1px solid var(--border);
      border-radius: 10px;
      background: var(--card);
      padding: 14px;
      margin-bottom: 12px;
    }
    pre {
      background: #111827;
      color: #e5e7eb;
      padding: 10px;
      border-radius: 8px;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-word;
    }
  </style>
</head>
<body>
  <main class="container">
    <h1>Integration Report - Services</h1>
    <p class="meta">Generated at: ${escapeHtml(generatedAt)}</p>

    <section class="summary">
      <div class="card">
        <div>Total services</div>
        <div class="value">${results.length}</div>
      </div>
      <div class="card">
        <div>Passed</div>
        <div class="value pass">${passedCount}</div>
      </div>
      <div class="card">
        <div>Failed</div>
        <div class="value fail">${failedCount}</div>
      </div>
    </section>

    <table>
      <thead>
        <tr>
          <th>Service</th>
          <th>Result</th>
          <th>HTTP</th>
          <th>Duration (ms)</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <h2>Details</h2>
    ${details}
  </main>
</body>
</html>`;
}

async function main() {
  const results = [];

  for (const service of services) {
    // Run each service sequentially to avoid port/resource collisions during startup.
    const result = await runServiceIntegration(service);
    results.push(result);
    const tag = result.passed ? 'PASS' : 'FAIL';
    console.log(`[${tag}] ${service.name} - status=${result.status ?? 'N/A'} duration=${result.durationMs}ms`);
  }

  const markdown = buildMarkdown(results);
  const html = buildHtml(results);
  await mkdir(integrationReportDir, { recursive: true });
  await writeFile(reportMdPath, markdown, 'utf8');
  await writeFile(reportJsonPath, JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2), 'utf8');
  await writeFile(reportHtmlPath, html, 'utf8');

  const failed = results.filter((r) => !r.passed).length;
  if (failed > 0) {
    process.exitCode = 1;
  }

  console.log(`Report written to ${reportMdPath}`);
  console.log(`JSON written to ${reportJsonPath}`);
  console.log(`HTML written to ${reportHtmlPath}`);
}

main().catch((error) => {
  console.error('Integration report failed:', error);
  process.exit(1);
});
