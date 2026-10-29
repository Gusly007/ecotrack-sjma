// SCRUM-16 : choix de navigation limités à l'onglet, sans modifier les collectes.
// Les identifiants d'agent et de tournée isolent les choix sur un appareil partagé.
function normalizeId(value) {
  if (!/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) <= 0) {
    throw new Error('Identifiant de parcours invalide');
  }
  return String(Number(value));
}

function storageKey(agentId, tourneeId) {
  return `ecotrack:agent:${normalizeId(agentId)}:tournee:${normalizeId(tourneeId)}:ignored:v1`;
}

export function getIgnoredEtapes(agentId, tourneeId) {
  const raw = sessionStorage.getItem(storageKey(agentId, tourneeId));
  if (raw === null) return [];
  const ids = JSON.parse(raw);
  if (!Array.isArray(ids)) throw new Error('Liste des étapes ignorées invalide');
  return [...new Set(ids.map(normalizeId))];
}

export function setEtapeIgnored(agentId, tourneeId, etapeId) {
  const id = normalizeId(etapeId);
  const ids = [...new Set([...getIgnoredEtapes(agentId, tourneeId), id])];
  sessionStorage.setItem(storageKey(agentId, tourneeId), JSON.stringify(ids));
  return ids;
}
