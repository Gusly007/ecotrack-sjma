/**
 * This script analyzes the test files in the 'services' directory to determine the distribution of unit, integration, and e2e tests. It generates a report in JSON, Markdown, and HTML formats, indicating whether the distribution meets the defined targets and ranges for each test type.
 * 
 * Usage: Run this script from the root of the project using Node.js. It will output the report in the 'reports/pyramid' directory.
 * 
 * Note: The classification of test files is based on their naming conventions and directory structure. Adjust the classify function if your project uses different patterns.
 */
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const servicesRoot = join(root, 'services');
const outDir = join(root, 'reports', 'pyramid');
const outJson = join(outDir, 'report.json');
const outMd = join(outDir, 'report.md');
const outHtml = join(outDir, 'index.html');

const TARGET = { unit: 70, integration: 20, e2e: 10 };
const RANGE = {
  unit: { min: 60, max: 85 },
  integration: { min: 15, max: 25 },
  e2e: { min: 5, max: 15 }
};

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === 'coverage' || e.name === 'reports') continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

function classify(file) {
  const f = file.toLowerCase().replaceAll('\\', '/');
  if (!f.endsWith('.test.js') && !f.endsWith('.test.jsx') && !f.endsWith('.integration.test.js') && !f.endsWith('.e2e.test.js')) return null;
  if (f.includes('/e2e/')) return 'e2e';
  if (f.includes('/integration/') || f.includes('.integration.test.')) return 'integration';
  return 'unit';
}

function pct(n, total) {
  return total === 0 ? 0 : Number(((n / total) * 100).toFixed(1));
}

function inRange(type, value) {
  return value >= RANGE[type].min && value <= RANGE[type].max;
}

function esc(v) { return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

async function main() {
  const serviceDirs = (await readdir(servicesRoot, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
  let unit = 0;
  let integration = 0;
  let e2e = 0;

  for (const s of serviceDirs) {
    const files = await walk(join(servicesRoot, s));
    for (const f of files) {
      const t = classify(f);
      if (!t) continue;
      if (t === 'unit') unit += 1;
      if (t === 'integration') integration += 1;
      if (t === 'e2e') e2e += 1;
    }
  }

  const total = unit + integration + e2e;
  const percentages = { unit: pct(unit, total), integration: pct(integration, total), e2e: pct(e2e, total) };
  const checks = {
    unit: inRange('unit', percentages.unit),
    integration: inRange('integration', percentages.integration),
    e2e: inRange('e2e', percentages.e2e)
  };

  const result = {
    generatedAt: new Date().toISOString(),
    target: TARGET,
    range: RANGE,
    counts: { unit, integration, e2e, total },
    percentages,
    checks,
    passed: checks.unit && checks.integration && checks.e2e
  };

  await mkdir(outDir, { recursive: true });
  await writeFile(outJson, JSON.stringify(result, null, 2), 'utf8');

  const md = [
    '# Test Pyramid Report',
    '',
    `Generated at: ${result.generatedAt}`,
    `Total test files: ${total}`,
    '',
    '| Type | Count | % | Target | Allowed Range | Status |',
    '|---|---:|---:|---:|---|---|',
    `| Unit | ${unit} | ${percentages.unit}% | ${TARGET.unit}% | ${RANGE.unit.min}-${RANGE.unit.max}% | ${checks.unit ? 'PASS' : 'FAIL'} |`,
    `| Integration | ${integration} | ${percentages.integration}% | ${TARGET.integration}% | ${RANGE.integration.min}-${RANGE.integration.max}% | ${checks.integration ? 'PASS' : 'FAIL'} |`,
    `| E2E | ${e2e} | ${percentages.e2e}% | ${TARGET.e2e}% | ${RANGE.e2e.min}-${RANGE.e2e.max}% | ${checks.e2e ? 'PASS' : 'FAIL'} |`
  ].join('\n');
  await writeFile(outMd, md, 'utf8');

  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Test Pyramid</title><style>body{font-family:Segoe UI,Arial,sans-serif;padding:24px;background:#f8fafc;color:#0f172a}.ok{color:#166534;font-weight:700}.ko{color:#991b1b;font-weight:700}table{width:100%;border-collapse:collapse;background:#fff}th,td{padding:10px;border:1px solid #e2e8f0;text-align:left}</style></head><body><h1>Test Pyramid Report</h1><p>Total test files: ${total}</p><table><thead><tr><th>Type</th><th>Count</th><th>%</th><th>Target</th><th>Allowed</th><th>Status</th></tr></thead><tbody><tr><td>Unit</td><td>${unit}</td><td>${percentages.unit}%</td><td>${TARGET.unit}%</td><td>${RANGE.unit.min}-${RANGE.unit.max}%</td><td class="${checks.unit ? 'ok' : 'ko'}">${checks.unit ? 'PASS' : 'FAIL'}</td></tr><tr><td>Integration</td><td>${integration}</td><td>${percentages.integration}%</td><td>${TARGET.integration}%</td><td>${RANGE.integration.min}-${RANGE.integration.max}%</td><td class="${checks.integration ? 'ok' : 'ko'}">${checks.integration ? 'PASS' : 'FAIL'}</td></tr><tr><td>E2E</td><td>${e2e}</td><td>${percentages.e2e}%</td><td>${TARGET.e2e}%</td><td>${RANGE.e2e.min}-${RANGE.e2e.max}%</td><td class="${checks.e2e ? 'ok' : 'ko'}">${checks.e2e ? 'PASS' : 'FAIL'}</td></tr></tbody></table></body></html>`;
  await writeFile(outHtml, html, 'utf8');

  console.log(`Pyramid report written to ${outHtml}`);
  if (!result.passed) {
    console.warn('Test pyramid is outside target ranges (report generated).');
    if (process.env.PYRAMID_ENFORCE === 'true') {
      process.exitCode = 1;
    }
  }
}

main().catch((err) => {
  console.error('Pyramid metrics failed:', err);
  process.exit(1);
});
