/**
 * Clean test report HTML - replace long paths with short names
 * Run after tests
 */

const fs = require('fs');
const path = require('path');

const reportPath = 'test-results/test-report.html';

if (!fs.existsSync(reportPath)) {
  console.log('No report found. Run tests first.');
  process.exit(1);
}

let html = fs.readFileSync(reportPath, 'utf8');

// Replace long paths with short test names
const replacements = [
  // Unit tests
  [/test[\\\/]unit[\\\/]services[\\\/]tournee-service\.test\.js/g, 'Tournee Service (Unit)'],
  [/test[\\\/]unit[\\\/]services[\\\/]vehicule-service\.test\.js/g, 'Vehicule Service (Unit)'],
  [/test[\\\/]unit[\\\/]services[\\\/]signalement-service\.test\.js/g, 'Signalement Service (Unit)'],
  [/test[\\\/]unit[\\\/]services[\\\/]stats-service\.test\.js/g, 'Stats Service (Unit)'],
  [/test[\\\/]unit[\\\/]services[\\\/]collecte-service\.test\.js/g, 'Collecte Service (Unit)'],
  [/test[\\\/]unit[\\\/]services[\\\/]cacheService\.test\.js/g, 'Cache Service (Unit)'],
  [/test[\\\/]unit[\\\/]services[\\\/]optimization-service\.test\.js/g, 'Optimization Service (Unit)'],
  [/test[\\\/]unit[\\\/]controllers[\\\/]tournee-controller\.test\.js/g, 'Tournee Controller (Unit)'],
  [/test[\\\/]unit[\\\/]controllers[\\\/]vehicule-controller\.test\.js/g, 'Vehicule Controller (Unit)'],
  [/test[\\\/]unit[\\\/]controllers[\\\/]signalement-controller\.test\.js/g, 'Signalement Controller (Unit)'],
  [/test[\\\/]unit[\\\/]controllers[\\\/]stats-controller\.test\.js/g, 'Stats Controller (Unit)'],
  [/test[\\\/]unit[\\\/]controllers[\\\/]collecte-controller\.test\.js/g, 'Collecte Controller (Unit)'],
  [/test[\\\/]unit[\\\/]middleware[\\\/]error-handler\.test\.js/g, 'Error Handler (Unit)'],
  [/test[\\\/]unit[\\\/]middleware[\\\/]rbac\.test\.js/g, 'RBAC Middleware (Unit)'],
  [/test[\\\/]unit[\\\/]utils[\\\/]api-error\.test\.js/g, 'API Error (Unit)'],
  [/test[\\\/]unit[\\\/]utils[\\\/]api-response\.test\.js/g, 'API Response (Unit)'],
  [/test[\\\/]unit[\\\/]utils[\\\/]logger\.test\.js/g, 'Logger (Unit)'],
  // Integration tests
  [/test[\\\/]integration[\\\/]signalement-route\.integration\.test\.js/g, 'Signalement Route (Integration)'],
  // E2E tests
  [/test[\\\/]e2e[\\\/]signalement\.e2e\.test\.js/g, 'Signalement E2E']
];

replacements.forEach(([regex, replacement]) => {
  html = html.replace(regex, replacement);
});

// Save cleaned report
const cleanedPath = 'test-results/test-report-clean.html';
fs.writeFileSync(cleanedPath, html);

console.log(`✓ Report cleaned: ${cleanedPath}`);
console.log(`  Original: ${reportPath}`);