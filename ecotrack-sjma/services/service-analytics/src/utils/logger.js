const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFile = path.join(logsDir, `analytics-${new Date().toISOString().split('T')[0]}.log`);

function formatLog(level, message, meta = {}) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta
  }) + '\n';
}

function writeLog(level, message, meta) {
  const log = formatLog(level, message, meta);
  fs.appendFileSync(logFile, log);
  
  const colors = {
    info: '\x1b[36m',
    warn: '\x1b[33m',
    error: '\x1b[31m',
    success: '\x1b[32m'
  };
  console.log(`${colors[level] || ''}[${level.toUpperCase()}] ${message}\x1b[0m`);
}

module.exports = {
  info: (message, meta) => writeLog('info', message, meta),
  warn: (message, meta) => writeLog('warn', message, meta),
  error: (message, meta) => writeLog('error', message, meta),
  success: (message, meta) => writeLog('success', message, meta)
};