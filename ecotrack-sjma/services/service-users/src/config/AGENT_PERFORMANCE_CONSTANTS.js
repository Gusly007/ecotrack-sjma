import { loadAgentPerformanceConstants } from '../repositories/agentPerformanceConstants.repository.js';

let defaultConstants = {
    COLLECTES_QUOTIDIENNES_CIBLE: 10,
    COLLECTES_HEBDO_CIBLE: 45,
    TEMPS_MOYEN_COLLECTE: 15,
    TAUX_COMPLETION_CIBLE: 95,
    SIGNALEMENTS_QUOTIDIENS_CIBLE: 5,
    SIGNALEMENTS_QUOTIDIENS_MAX: 20,
    TEMPS_MOYEN_TRAITEMENT: 48,
    TAUX_VALIDATION_CIBLE: 80,
    ZONES_COUVERTES_CIBLE: 5,
    CONTENEURS_PAR_ZONE_CIBLE: 20,
    RAYON_INTERVENTION_KM: 10,
    EFFICACITE_CIBLE: 85,
    PONCTUALITE_CIBLE: 90,
    DISPONIBILITE_CIBLE: 80,
    SATISFACTION_CIBLE: 4.5,
    HEURES_TRAVAIL_QUOTIDIEN: 8,
    PAUSE_MOYENNE_MINUTES: 30,
    TEMPS_REPONSE_URGENT: 30,
    VEHICULES_ENTRETIENT_QUOTIDIEN: 1,
    KILOMETRES_ENTRE_MAX: 300
};

export const AGENT_PERFORMANCE_CONSTANTS = {
    get COLLECTES_QUOTIDIENNES_CIBLE() { return defaultConstants.COLLECTES_QUOTIDIENNES_CIBLE; },
    get COLLECTES_HEBDO_CIBLE() { return defaultConstants.COLLECTES_HEBDO_CIBLE; },
    get TEMPS_MOYEN_COLLECTE() { return defaultConstants.TEMPS_MOYEN_COLLECTE; },
    get TAUX_COMPLETION_CIBLE() { return defaultConstants.TAUX_COMPLETION_CIBLE; },
    get SIGNALEMENTS_QUOTIDIENS_CIBLE() { return defaultConstants.SIGNALEMENTS_QUOTIDIENS_CIBLE; },
    get SIGNALEMENTS_QUOTIDIENS_MAX() { return defaultConstants.SIGNALEMENTS_QUOTIDIENS_MAX; },
    get TEMPS_MOYEN_TRAITEMENT() { return defaultConstants.TEMPS_MOYEN_TRAITEMENT; },
    get TAUX_VALIDATION_CIBLE() { return defaultConstants.TAUX_VALIDATION_CIBLE; },
    get ZONES_COUVERTES_CIBLE() { return defaultConstants.ZONES_COUVERTES_CIBLE; },
    get CONTENEURS_PAR_ZONE_CIBLE() { return defaultConstants.CONTENEURS_PAR_ZONE_CIBLE; },
    get RAYON_INTERVENTION_KM() { return defaultConstants.RAYON_INTERVENTION_KM; },
    get EFFICACITE_CIBLE() { return defaultConstants.EFFICACITE_CIBLE; },
    get PONCTUALITE_CIBLE() { return defaultConstants.PONCTUALITE_CIBLE; },
    get DISPONIBILITE_CIBLE() { return defaultConstants.DISPONIBILITE_CIBLE; },
    get SATISFACTION_CIBLE() { return defaultConstants.SATISFACTION_CIBLE; },
    get HEURES_TRAVAIL_QUOTIDIEN() { return defaultConstants.HEURES_TRAVAIL_QUOTIDIEN; },
    get PAUSE_MOYENNE_MINUTES() { return defaultConstants.PAUSE_MOYENNE_MINUTES; },
    get TEMPS_REPONSE_URGENT() { return defaultConstants.TEMPS_REPONSE_URGENT; },
    get VEHICULES_ENTRETIENT_QUOTIDIEN() { return defaultConstants.VEHICULES_ENTRETIENT_QUOTIDIEN; },
    get KILOMETRES_ENTRE_MAX() { return defaultConstants.KILOMETRES_ENTRE_MAX; }
};

export const loadFromDatabase = async () => {
    try {
        const constants = await loadAgentPerformanceConstants();
        if (constants.size > 0) {
            defaultConstants = Object.fromEntries(constants);
        }
    } catch (err) {
        console.error('Failed to load agent performance constants from DB, using defaults:', err);
    }
};

export const getConstant = async (key) => {
    const { getAgentPerformanceConstant } = await import('../repositories/agentPerformanceConstants.repository.js');
    const value = await getAgentPerformanceConstant(key);
    return value ?? defaultConstants[key] ?? null;
};

export const calculateEfficaciteScore = (collectesRealisees, collectesCibles) => {
    if (collectesCibles === 0) return 0;
    return Math.min(100, (collectesRealisees / collectesCibles) * 100);
};

export const calculatePonctualiteScore = (tournéesTermineesATemps, totalTournées) => {
    if (totalTournées === 0) return 0;
    return (tournéesTermineesATemps / totalTournées) * 100;
};

export const calculatePerformanceGlobale = (efficacite, ponctualite, satisfaction) => {
    const poidsEfficacite = 0.4;
    const poidsPonctualite = 0.35;
    const poidsSatisfaction = 0.25;
    return (efficacite * poidsEfficacite) + (ponctualite * poidsPonctualite) + (satisfaction * poidsSatisfaction);
};

export const calculateTempsEstimeCollectes = (nombreCollectes) => {
    return nombreCollectes * AGENT_PERFORMANCE_CONSTANTS.TEMPS_MOYEN_COLLECTE;
};

export const calculateJoursTravailNecessaires = (totalCollectes) => {
    const collecteParJour = AGENT_PERFORMANCE_CONSTANTS.COLLECTES_QUOTIDIENNES_CIBLE;
    if (collecteParJour === 0) return 0;
    return Math.ceil(totalCollectes / collecteParJour);
};

export default AGENT_PERFORMANCE_CONSTANTS;
