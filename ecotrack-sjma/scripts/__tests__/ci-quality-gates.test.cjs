const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const yaml = require('../../frontend/node_modules/js-yaml');

const app = path.resolve(__dirname, '../..');
const frontend = path.join(app, 'frontend');
const eslint = path.join(frontend, 'node_modules/eslint/bin/eslint.js');
const { jobs } = yaml.load(readFileSync(path.resolve(app, '../.github/workflows/ci.yml'), 'utf8'));

function blockingStep(jobName, match) {
  const job = jobs[jobName];
  const step = job.steps.find(match);
  assert.ok(step, `Contrôle manquant dans ${jobName}`);
  assert.ok(!job['continue-on-error'] && !step['continue-on-error'], `Échec ignoré dans ${jobName}`);
  assert.doesNotMatch(step.run || '', /\|\||continue-on-error/);
  return step;
}

for (const [job, command] of [['test-routes-unit', 'npm run test:coverage'], ['test-routes-e2e', 'npm run test:e2e']]) {
  test(`un échec de ${job} remonte au workflow`, () => {
    blockingStep(job, step => step.run?.trim() === command);
  });
}

test('les alertes du scan ZAP font échouer le job DAST', () => {
  const scan = blockingStep('security-dast', step => step.uses?.startsWith('zaproxy/action-baseline@'));
  assert.equal(String(scan.with.fail_action), 'true');
});

for (const [scope, job, cwd, filename, extraArgs] of [
  ['backend', 'lint', app, 'services/service-routes/src/probe.js', ['--config', 'eslint.backend.config.cjs']],
  ['Agent', 'test-frontend', frontend, 'src/pages/mobile/agent/probe.jsx', []],
]) {
  test(`ESLint ${scope} accepte un fichier valide et rejette une référence inconnue`, () => {
    const step = blockingStep(job, step => step.run?.includes('eslint') &&
      step.run.replace('${{ matrix.service }}', 'service-routes').includes(path.posix.dirname(filename)));
    assert.match(step.run, /--max-warnings 0/);
    const args = [eslint, ...extraArgs, '--max-warnings', '0', '--stdin', '--stdin-filename', filename];
    const run = input => spawnSync(process.execPath, args, { cwd, input, encoding: 'utf8' });
    const valid = run('Math.abs(-1);');
    assert.equal(valid.status, 0, valid.stderr || valid.stdout);
    const invalid = run('unknownScrum13Function();');
    assert.equal(invalid.status, 1, invalid.stderr || invalid.stdout);
    assert.match(invalid.stdout, /no-undef/);
  });
}
