export const HEURE_DEBUT_JOUR_FUTUR = "07:30";
const PAS_MINUTES = 15;
const MINUTES_PAR_JOUR = 24 * 60;

const pad = (n) => String(n).padStart(2, "0");

export function toLocalIsoDate(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function prochainQuartDHeure(now) {
  const minutes = now.getHours() * 60 + now.getMinutes() + 1;
  return Math.ceil(minutes / PAS_MINUTES) * PAS_MINUTES;
}

export function getDefaultHeureDebut(dateIso, now = new Date()) {
  if (dateIso !== toLocalIsoDate(now)) return HEURE_DEBUT_JOUR_FUTUR;
  const minutes = Math.min(prochainQuartDHeure(now), MINUTES_PAR_JOUR - 1);
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

export function buildInitialCreateForm(now = new Date()) {
  if (prochainQuartDHeure(now) < MINUTES_PAR_JOUR) {
    const date = toLocalIsoDate(now);
    return { date_tournee: date, heure_debut_prevue: getDefaultHeureDebut(date, now) };
  }
  const demain = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return { date_tournee: toLocalIsoDate(demain), heure_debut_prevue: HEURE_DEBUT_JOUR_FUTUR };
}

export function isDepartPasse(dateIso, heure, now = new Date()) {
  if (!dateIso || !heure) return false;
  const [annee, mois, jour] = dateIso.split("-").map(Number);
  const [h, m] = heure.split(":").map(Number);
  return new Date(annee, mois - 1, jour, h, m) <= now;
}
