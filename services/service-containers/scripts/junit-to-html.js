#!/usr/bin/env node

/**
 * Convert JUnit XML test reports to HTML
 * Usage: node scripts/junit-to-html.js [testType]
 * Example: node scripts/junit-to-html.js unit
 */

const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

const testType = process.argv[2] || 'all';
const reportDir = path.join(__dirname, '../coverage/junit');
const htmlDir = path.join(__dirname, '../coverage/html-reports');

// Ensure output directory exists
if (!fs.existsSync(htmlDir)) {
  fs.mkdirSync(htmlDir, { recursive: true });
}

async function convertJunitToHtml() {
  try {
    const xmlFile = path.join(reportDir, 'junit.xml');
    
    if (!fs.existsSync(xmlFile)) {
      console.log(`❌ JUnit XML file not found at ${xmlFile}`);
      console.log('Run tests first: npm test');
      return;
    }

    const xmlContent = fs.readFileSync(xmlFile, 'utf-8');
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlContent);
    
    const testSuite = result.testsuites.testsuite;
    const htmlContent = generateHtml(testSuite);
    
    const htmlFile = path.join(htmlDir, `${testType}-report.html`);
    fs.writeFileSync(htmlFile, htmlContent);
    
    console.log(`✅ HTML report generated: ${htmlFile}`);
  } catch (error) {
    console.error('Error converting JUnit to HTML:', error.message);
    process.exit(1);
  }
}

function generateHtml(testSuites) {
  const suites = Array.isArray(testSuites) ? testSuites : [testSuites];
  
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  let totalTime = 0;

  const suiteRows = suites.map(suite => {
    const tests = suite.testcase ? (Array.isArray(suite.testcase) ? suite.testcase : [suite.testcase]) : [];
    const passed = tests.filter(t => !t.failure && !t.skipped).length;
    const failed = tests.filter(t => t.failure).length;
    const skipped = tests.filter(t => t.skipped).length;
    const time = parseFloat(suite.$.time || 0);

    totalTests += tests.length;
    totalPassed += passed;
    totalFailed += failed;
    totalSkipped += skipped;
    totalTime += time;

    const status = failed > 0 ? 'FAILED' : 'PASSED';
    const statusColor = failed > 0 ? '#ff6b6b' : '#51cf66';

    return `
      <tr>
        <td><strong>${suite.$.name}</strong></td>
        <td style="text-align: center;">${tests.length}</td>
        <td style="text-align: center; color: #51cf66;"><strong>${passed}</strong></td>
        <td style="text-align: center; color: #ff6b6b;"><strong>${failed}</strong></td>
        <td style="text-align: center; color: #ffd43b;"><strong>${skipped}</strong></td>
        <td style="text-align: center;">${time.toFixed(3)}s</td>
        <td style="text-align: center; background: ${statusColor}; color: white; font-weight: bold; padding: 5px; border-radius: 4px;">${status}</td>
      </tr>
    `;
  }).join('');

  const passRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) : 0;
  const passRateColor = passRate >= 90 ? '#51cf66' : passRate >= 70 ? '#ffd43b' : '#ff6b6b';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Service Containers - Test Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 30px 15px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }

    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
    }

    .header p {
      font-size: 14px;
      opacity: 0.9;
    }

    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 30px;
      background: #f8f9fa;
    }

    .summary-item {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      text-align: center;
    }

    .summary-item strong {
      display: block;
      font-size: 32px;
      font-weight: bold;
      margin: 10px 0;
      color: #667eea;
    }

    .summary-item span {
      color: #666;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .summary-item.passed strong {
      color: #51cf66;
    }

    .summary-item.failed strong {
      color: #ff6b6b;
    }

    .summary-item.skipped strong {
      color: #ffd43b;
    }

    .pass-rate {
      padding: 30px;
      text-align: center;
      background: white;
      border-bottom: 1px solid #eee;
    }

    .pass-rate-value {
      font-size: 48px;
      font-weight: bold;
      color: ${passRateColor};
      margin-bottom: 10px;
    }

    .pass-rate-label {
      color: #666;
      font-size: 14px;
    }

    .content {
      padding: 30px;
    }

    .table-wrapper {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }

    th {
      background: #f8f9fa;
      border-bottom: 2px solid #ddd;
      padding: 15px;
      text-align: left;
      font-weight: 600;
      color: #333;
    }

    td {
      padding: 15px;
      border-bottom: 1px solid #eee;
    }

    tr:hover {
      background: #f8f9fa;
    }

    .footer {
      text-align: center;
      padding: 20px;
      background: #f8f9fa;
      color: #666;
      font-size: 12px;
    }

    .timestamp {
      color: #999;
      font-size: 12px;
      margin-top: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📦 Service Containers Test Report</h1>
      <p>Comprehensive test results and metrics</p>
    </div>

    <div class="summary">
      <div class="summary-item">
        <span>Total Tests</span>
        <strong>${totalTests}</strong>
      </div>
      <div class="summary-item passed">
        <span>✅ Passed</span>
        <strong>${totalPassed}</strong>
      </div>
      <div class="summary-item failed">
        <span>❌ Failed</span>
        <strong>${totalFailed}</strong>
      </div>
      <div class="summary-item skipped">
        <span>⏭️ Skipped</span>
        <strong>${totalSkipped}</strong>
      </div>
    </div>

    <div class="pass-rate">
      <div class="pass-rate-value">${passRate}%</div>
      <div class="pass-rate-label">Pass Rate</div>
    </div>

    <div class="content">
      <h2 style="margin-bottom: 20px; color: #333;">Test Suite Results</h2>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Test Suite</th>
              <th style="text-align: center;">Tests</th>
              <th style="text-align: center;">✅ Passed</th>
              <th style="text-align: center;">❌ Failed</th>
              <th style="text-align: center;">⏭️ Skipped</th>
              <th style="text-align: center;">Time</th>
              <th style="text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${suiteRows}
          </tbody>
        </table>
      </div>
    </div>

    <div class="footer">
      <p>Generated on ${new Date().toLocaleString()}</p>
      <p class="timestamp">Service Containers Test Suite Reports</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Run if xml2js is available, otherwise provide helper
try {
  require.resolve('xml2js');
  convertJunitToHtml();
} catch {
  console.log('⚠️  xml2js not found. Installing...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install xml2js', { stdio: 'inherit' });
    convertJunitToHtml();
  } catch (error) {
    console.error('Failed to install xml2js:', error.message);
    process.exit(1);
  }
}
