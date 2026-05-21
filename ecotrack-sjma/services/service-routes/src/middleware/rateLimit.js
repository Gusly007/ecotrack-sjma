const rateLimit = require('express-rate-limit');

const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000;
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX) || 100;

// Bypass localhost en dev. Sans ça, un citoyen qui rafraîchit son accueil
// quelques fois (5 appels parallèles par chargement) explose les 100
// req/min par défaut, et "Mes signalements" se vide brutalement avec un
// message "Trop de requêtes".
const localhostIps = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

const isLocalDevBypassEnabled = () => {
  if (process.env.RATE_LIMIT_BYPASS_LOCAL === 'true') return true;
  if (process.env.RATE_LIMIT_BYPASS_LOCAL === 'false') return false;
  return (process.env.NODE_ENV || 'development') === 'development';
};

const hasLocalhostHostHeader = (req) => {
  const host = (req.headers?.host || '').toLowerCase();
  const forwardedHost = (req.headers?.['x-forwarded-host'] || '').toLowerCase();
  return host.includes('localhost')
    || host.includes('127.0.0.1')
    || forwardedHost.includes('localhost')
    || forwardedHost.includes('127.0.0.1');
};

const skipForDev = (req) => {
  if (req.path === '/health' || req.path === '/metrics') return true;
  if (!isLocalDevBypassEnabled()) return false;
  // En dev on bypasse même si l'IP ne matche pas — les requêtes traversent
  // la bridge Docker (172.x) entre frontend → gateway → upstream et le
  // contrôle d'IP seul ne suffit pas.
  if ((process.env.NODE_ENV || 'development') === 'development') return true;
  return localhostIps.has(req.ip) || hasLocalhostHostHeader(req);
};

const publicLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  message: {
    success: false,
    statusCode: 429,
    message: 'Trop de requêtes, veuillez réessayer plus tard.',
    retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipForDev,
});

const tourneeLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: 50,
  message: {
    success: false,
    statusCode: 429,
    message: 'Trop de requêtes sur les tournées.',
    retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  skip: skipForDev,
});

const optimizeLimiter = rateLimit({
  windowMs: 60000,
  max: 10,
  message: {
    success: false,
    statusCode: 429,
    message: 'Trop de requêtes d\'optimisation. Limite: 10/min.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  skip: skipForDev,
});

module.exports = {
  publicLimiter,
  tourneeLimiter,
  optimizeLimiter
};
