// Helpers sécurité partagés (OWASP A3 XSS + A4 leakage).
// Tous purs, sans dépendance, tolèrent les entrées non-string (return safe
// default plutôt que throw).

// Schémas autorisés pour <img src> :
//   data:image/(png|jpe?g|gif|webp|svg+xml);…
//   http(s)://…
//   /chemin/relatif
// Tout ce qui ne matche pas (javascript:, vbscript:, data:text/html, etc.)
// retourne null → le composant doit alors masquer le bloc.
const SAFE_IMG_PATTERN = /^(?:data:image\/(?:png|jpe?g|gif|webp|svg\+xml);|https?:\/\/|\/)/i;

export function safeImageSrc(src) {
  if (typeof src !== 'string') return null;
  const trimmed = src.trim();
  if (!trimmed) return null;
  return SAFE_IMG_PATTERN.test(trimmed) ? trimmed : null;
}

// Regex pragmatique RFC 5322 simplifiée. Le backend valide aussi (Zod),
// donc on accepte les faux positifs raisonnables et on rejette uniquement
// les saisies clairement invalides.
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function isValidEmail(value) {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  if (v.length === 0 || v.length > 254) return false;
  return EMAIL_PATTERN.test(v);
}

// trim() + collapse des espaces multiples + tronque à maxLength.
// Évite les variantes invisibles (espaces accidentels, retours à la ligne).
export function normalizeText(value, { maxLength } = {}) {
  if (value == null) return '';
  let s = String(value).trim().replace(/\s+/g, ' ');
  if (typeof maxLength === 'number' && maxLength > 0 && s.length > maxLength) {
    s = s.slice(0, maxLength);
  }
  return s;
}

// Mots-clés ou fragments qui trahissent un message technique non destiné à
// l'utilisateur final. Si l'un d'eux apparaît dans le message d'erreur on
// retombe sur le `fallback` côté UI.
const TECH_HINTS = [
  'Error:', 'at ', 'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'EHOSTUNREACH',
  'pg_', 'PostgreSQL', 'TypeError', 'ReferenceError', 'SyntaxError',
  'node_modules', '/src/', '\\src\\', 'undefined is not', 'cannot read prop',
  'Unexpected token', 'JSON.parse', 'stack',
];

export function safeErrorMessage(err, fallback = 'Une erreur est survenue.') {
  if (!err) return fallback;
  const raw =
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    (typeof err === 'string' ? err : '');
  if (!raw || typeof raw !== 'string') return fallback;
  const msg = raw.trim();
  if (msg.length === 0 || msg.length > 200) return fallback;
  for (const hint of TECH_HINTS) {
    if (msg.includes(hint)) return fallback;
  }
  return msg;
}
