// Construit l'URL absolue d'un avatar à partir du chemin renvoyé par
// service-users. Les chemins en base ressemblent à
// "/avatars/original/35.jpg" et sont servis statiquement par service-users
// derrière la gateway sur le préfixe /avatars.
//
// On ajoute aussi `?t=<timestamp>` pour qu'un nouvel upload ne serve pas
// l'ancienne image en cache. Ceinture + bretelles (le nom de fichier
// change déjà à chaque upload), mais utile en dev / local.
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function buildAvatarUrl(path, { bust } = {}) {
  if (!path) return null;
  // URL absolue ? On la garde telle quelle.
  if (/^https?:\/\//i.test(path)) return path;
  const clean = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_BASE}${clean}`;
  if (bust) return `${url}?t=${bust}`;
  return url;
}
