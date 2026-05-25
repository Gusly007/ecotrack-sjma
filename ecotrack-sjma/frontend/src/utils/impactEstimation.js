// Estimation d'impact environnemental — sources ADEME Base Empreinte /
// Base Carbone + feuille de route décarbonation filière verre (gouv.fr).
//
// Règles d'attribution :
//   - kg triés : comptés quand statut ∈ {EN_COURS, RESOLU}
//   - CO₂ évité : compté uniquement quand statut = RESOLU ET hasCO2Filiere
//
// Les facteurs ADEME sont versionnés ici en dur (mise à jour 1–2 fois/an).

export const METHODOLOGY_NOTE =
  "Estimations basées sur les facteurs d'émissions évitées de l'ADEME / Base Carbone. Ces valeurs constituent des ordres de grandeur et non des mesures exactes.";

// Fourchettes (en kg) et matière dominante par type de signalement.
// `hasCO2Filiere = false` quand l'effet est opérationnel/technique sans
// chaîne de valorisation matière directe (capteur défaillant, conteneur
// endommagé/sale).
export const TYPE_ESTIMATIONS = {
  DEPOT_SAUVAGE:          { min: 5, max: 80, matiere: 'mixte',       hasCO2Filiere: true  },
  CONTENEUR_PLEIN:        { min: 3, max: 50, matiere: 'mixte',       hasCO2Filiere: true  },
  MAUVAISE_ODEUR:         { min: 2, max: 30, matiere: 'biodechets',  hasCO2Filiere: true  },
  CONTENEUR_INACCESSIBLE: { min: 2, max: 40, matiere: 'mixte',       hasCO2Filiere: true  },
  CONTENEUR_SALE:         { min: 1, max: 20, matiere: 'mixte',       hasCO2Filiere: false },
  CONTENEUR_ENDOMMAGE:    { min: 1, max: 15, matiere: 'mixte',       hasCO2Filiere: false },
  CAPTEUR_DEFAILLANT:     { min: 2, max: 25, matiere: 'aucune',      hasCO2Filiere: false },
};

// Facteurs d'émissions évitées (kgCO₂e par kg de matière correctement triée).
// Moyenne prudente pour `mixte` ; 0 pour les types sans filière.
export const CO2_FACTORS = {
  biodechets:    0.027,
  methanisation: 0.077,
  pet:           3.062,
  acier:         2.09,
  verre:         0.3,
  mixte:         0.5,
  aucune:        0,
};

// Multiplicateur appliqué au tonnage selon l'urgence choisie par le citoyen.
// Reflète qu'un débordement HAUTE génère typiquement plus de déchets non
// captés qu'une situation BASSE.
export const URGENCE_MULTIPLIER = {
  BASSE:   0.7,
  MOYENNE: 1.0,
  HAUTE:   1.3,
  URGENTE: 1.5,
};

// --- Helpers internes ------------------------------------------------------

const round2 = (n) => Math.round(Number(n) * 100) / 100;

const typeInfo = (typeCode) => {
  if (!typeCode) return null;
  return TYPE_ESTIMATIONS[String(typeCode).toUpperCase()] || null;
};

const urgenceFactor = (urgence) => {
  if (!urgence) return URGENCE_MULTIPLIER.MOYENNE;
  return URGENCE_MULTIPLIER[String(urgence).toUpperCase()] ?? URGENCE_MULTIPLIER.MOYENNE;
};

const co2Factor = (matiere) => {
  if (!matiere) return 0;
  return CO2_FACTORS[matiere] ?? 0;
};

// --- API publique ---------------------------------------------------------

export function isValide(statut) {
  if (!statut) return false;
  const s = String(statut).toUpperCase();
  return s === 'EN_COURS' || s === 'RESOLU';
}

export function isResolu(statut) {
  if (!statut) return false;
  return String(statut).toUpperCase() === 'RESOLU';
}

// Médiane × multiplicateur d'urgence. Représente la valeur centrale du
// signalement quand on doit choisir un nombre unique.
export function estimateKgTries(typeCode, urgence) {
  const info = typeInfo(typeCode);
  if (!info) return 0;
  const median = (info.min + info.max) / 2;
  return round2(median * urgenceFactor(urgence));
}

// Fourchette min–max × multiplicateur. Utilisée pour l'écran détail quand
// le signalement est OUVERT (on ne sait pas encore où on va atterrir).
export function rangeKgTries(typeCode, urgence) {
  const info = typeInfo(typeCode);
  if (!info) return { min: 0, max: 0 };
  const m = urgenceFactor(urgence);
  return {
    min: round2(info.min * m),
    max: round2(info.max * m),
  };
}

// CO₂ médian. 0 si la matière n'a pas de filière (capteur défaillant,
// conteneur sale/endommagé) — c'est volontaire : ces signalements
// améliorent l'opérationnel sans valoriser de matière.
export function estimateKgCO2(typeCode, urgence) {
  const info = typeInfo(typeCode);
  if (!info || !info.hasCO2Filiere) return 0;
  const kg = estimateKgTries(typeCode, urgence);
  return round2(kg * co2Factor(info.matiere));
}

// Fourchette CO₂ pour l'écran détail.
export function rangeKgCO2(typeCode, urgence) {
  const info = typeInfo(typeCode);
  if (!info || !info.hasCO2Filiere) return { min: 0, max: 0 };
  const { min, max } = rangeKgTries(typeCode, urgence);
  const f = co2Factor(info.matiere);
  return {
    min: round2(min * f),
    max: round2(max * f),
  };
}

// Objet complet pour un signalement : estimations + fourchettes + valeurs
// "actuelles" (qui ne comptent que si le statut le permet). Le consommateur
// décide ce qu'il affiche (carte, bandeau, etc.).
export function impactForSignalement(sig) {
  if (!sig) return null;
  // Champ libellé du type côté API liste : `type_signalement`. On accepte
  // aussi `type_code` et `type` au cas où le call-site passe une shape
  // différente.
  const typeCode = sig.type_signalement || sig.type_code || sig.type || null;
  const urgence = sig.urgence || 'MOYENNE';
  const statut = sig.statut;
  const info = typeInfo(typeCode);

  const valide = isValide(statut);
  const resolu = isResolu(statut);

  const kgTries = estimateKgTries(typeCode, urgence);
  const kgCO2 = estimateKgCO2(typeCode, urgence);
  const rangeTries = rangeKgTries(typeCode, urgence);
  const rangeCO2 = rangeKgCO2(typeCode, urgence);

  return {
    typeCode,
    urgence,
    statut,
    matiere: info?.matiere || null,
    hasCO2Filiere: !!info?.hasCO2Filiere,
    valide,
    resolu,
    estimation: { kgTries, kgCO2, rangeTries, rangeCO2 },
    actuel: {
      kgTries: valide ? kgTries : 0,
      kgCO2: resolu ? kgCO2 : 0,
    },
  };
}

// Agrégat pour l'accueil : somme les contributions ACTUELLES (pas les
// estimations forward-looking — sinon un signalement OUVERT alimenterait
// faussement "mon impact").
export function aggregateImpact(signalements = []) {
  let kgTries = 0;
  let kgCO2 = 0;
  let countValide = 0;
  let countResolu = 0;
  let count = 0;
  for (const sig of signalements) {
    const imp = impactForSignalement(sig);
    if (!imp) continue;
    count++;
    if (imp.valide) {
      countValide++;
      kgTries += imp.estimation.kgTries;
    }
    if (imp.resolu) {
      countResolu++;
      kgCO2 += imp.estimation.kgCO2;
    }
  }
  return {
    count,
    countValide,
    countResolu,
    kgTries: round2(kgTries),
    kgCO2: round2(kgCO2),
  };
}
