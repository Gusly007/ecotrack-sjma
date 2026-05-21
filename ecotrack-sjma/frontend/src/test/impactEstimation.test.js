import { describe, expect, it } from 'vitest';
import {
  estimateKgTries,
  estimateKgCO2,
  rangeKgTries,
  rangeKgCO2,
  isValide,
  isResolu,
  impactForSignalement,
  aggregateImpact,
  TYPE_ESTIMATIONS,
  CO2_FACTORS,
  URGENCE_MULTIPLIER,
  METHODOLOGY_NOTE,
} from '../utils/impactEstimation';

// Tests "smoke math" alignés sur la doc §7.21. Les valeurs exactes
// dépendent de l'ordre d'arrondi (médiane d'abord, puis multiplicateur,
// puis CO₂) ; on assert l'ordre de grandeur ADEME et les invariants
// structurels (filière absente → CO₂ = 0, range cohérent avec médiane).

describe('impactEstimation — tables', () => {
  it('exposes the 7 documented type codes', () => {
    expect(Object.keys(TYPE_ESTIMATIONS).sort()).toEqual([
      'CAPTEUR_DEFAILLANT',
      'CONTENEUR_ENDOMMAGE',
      'CONTENEUR_INACCESSIBLE',
      'CONTENEUR_PLEIN',
      'CONTENEUR_SALE',
      'DEPOT_SAUVAGE',
      'MAUVAISE_ODEUR',
    ]);
  });

  it('CO2_FACTORS contains ADEME-cited values', () => {
    expect(CO2_FACTORS.biodechets).toBe(0.027);
    expect(CO2_FACTORS.mixte).toBe(0.5);
    expect(CO2_FACTORS.aucune).toBe(0);
  });

  it('URGENCE_MULTIPLIER follows BASSE 0.7 / MOYENNE 1.0 / HAUTE 1.3', () => {
    expect(URGENCE_MULTIPLIER.BASSE).toBe(0.7);
    expect(URGENCE_MULTIPLIER.MOYENNE).toBe(1.0);
    expect(URGENCE_MULTIPLIER.HAUTE).toBe(1.3);
  });

  it('exports a methodology note string', () => {
    expect(typeof METHODOLOGY_NOTE).toBe('string');
    expect(METHODOLOGY_NOTE).toMatch(/ADEME/);
  });
});

describe('impactEstimation — helpers de statut', () => {
  it('isValide: EN_COURS et RESOLU only', () => {
    expect(isValide('EN_COURS')).toBe(true);
    expect(isValide('RESOLU')).toBe(true);
    expect(isValide('OUVERT')).toBe(false);
    expect(isValide('FERME')).toBe(false);
    expect(isValide(null)).toBe(false);
    expect(isValide(undefined)).toBe(false);
  });

  it('isResolu: only RESOLU', () => {
    expect(isResolu('RESOLU')).toBe(true);
    expect(isResolu('EN_COURS')).toBe(false);
    expect(isResolu('OUVERT')).toBe(false);
    expect(isResolu(null)).toBe(false);
  });
});

describe('impactEstimation — estimateKgTries', () => {
  it('CONTENEUR_PLEIN HAUTE : median × 1.3 (smoke ADEME)', () => {
    // min=3 max=50 → median=26.5 × 1.3 = 34.45
    expect(estimateKgTries('CONTENEUR_PLEIN', 'HAUTE')).toBeCloseTo(34.45, 2);
  });

  it('MAUVAISE_ODEUR BASSE : median × 0.7', () => {
    // min=2 max=30 → median=16 × 0.7 = 11.2
    expect(estimateKgTries('MAUVAISE_ODEUR', 'BASSE')).toBeCloseTo(11.2, 2);
  });

  it('unknown type code returns 0', () => {
    expect(estimateKgTries('UNKNOWN_TYPE', 'HAUTE')).toBe(0);
    expect(estimateKgTries(null, 'HAUTE')).toBe(0);
  });

  it('defaults to MOYENNE multiplier when urgence is missing', () => {
    const moyenne = estimateKgTries('DEPOT_SAUVAGE', 'MOYENNE');
    const undef = estimateKgTries('DEPOT_SAUVAGE', undefined);
    expect(undef).toBeCloseTo(moyenne, 2);
  });
});

describe('impactEstimation — estimateKgCO2', () => {
  it('CAPTEUR_DEFAILLANT returns 0 (aucune filière)', () => {
    expect(estimateKgCO2('CAPTEUR_DEFAILLANT', 'HAUTE')).toBe(0);
  });

  it('CONTENEUR_SALE returns 0 (hasCO2Filiere=false)', () => {
    expect(estimateKgCO2('CONTENEUR_SALE', 'MOYENNE')).toBe(0);
  });

  it('CONTENEUR_PLEIN HAUTE : kg × 0.5 (matière mixte)', () => {
    // 34.45 × 0.5 = 17.225 → arrondi 17.23 (round2)
    const co2 = estimateKgCO2('CONTENEUR_PLEIN', 'HAUTE');
    expect(co2).toBeGreaterThan(17);
    expect(co2).toBeLessThan(17.5);
  });

  it('MAUVAISE_ODEUR BASSE biodéchets : ≈ 0.3 kg CO₂', () => {
    // 11.2 × 0.027 = 0.3024 → arrondi 0.3
    expect(estimateKgCO2('MAUVAISE_ODEUR', 'BASSE')).toBeCloseTo(0.3, 1);
  });
});

describe('impactEstimation — ranges', () => {
  it('rangeKgTries DEPOT_SAUVAGE HAUTE : [5×1.3, 80×1.3]', () => {
    const r = rangeKgTries('DEPOT_SAUVAGE', 'HAUTE');
    expect(r.min).toBeCloseTo(6.5, 2);
    expect(r.max).toBeCloseTo(104, 2);
  });

  it('rangeKgCO2 CAPTEUR_DEFAILLANT returns {0,0}', () => {
    expect(rangeKgCO2('CAPTEUR_DEFAILLANT', 'HAUTE')).toEqual({ min: 0, max: 0 });
  });

  it('rangeKgTries unknown type returns {0,0}', () => {
    expect(rangeKgTries('FOO', 'HAUTE')).toEqual({ min: 0, max: 0 });
  });
});

describe('impactEstimation — impactForSignalement', () => {
  it('OUVERT: actuel is zero even if estimation > 0', () => {
    const sig = { type_signalement: 'CONTENEUR_PLEIN', urgence: 'HAUTE', statut: 'OUVERT' };
    const imp = impactForSignalement(sig);
    expect(imp.valide).toBe(false);
    expect(imp.resolu).toBe(false);
    expect(imp.estimation.kgTries).toBeGreaterThan(0);
    expect(imp.actuel.kgTries).toBe(0);
    expect(imp.actuel.kgCO2).toBe(0);
  });

  it('EN_COURS: kgTries comptabilisé, CO₂ encore 0', () => {
    const sig = { type_signalement: 'CONTENEUR_PLEIN', urgence: 'MOYENNE', statut: 'EN_COURS' };
    const imp = impactForSignalement(sig);
    expect(imp.valide).toBe(true);
    expect(imp.resolu).toBe(false);
    expect(imp.actuel.kgTries).toBeGreaterThan(0);
    expect(imp.actuel.kgCO2).toBe(0);
  });

  it('RESOLU: kgTries ET CO₂ comptabilisés', () => {
    const sig = { type_signalement: 'CONTENEUR_PLEIN', urgence: 'MOYENNE', statut: 'RESOLU' };
    const imp = impactForSignalement(sig);
    expect(imp.valide).toBe(true);
    expect(imp.resolu).toBe(true);
    expect(imp.actuel.kgTries).toBeGreaterThan(0);
    expect(imp.actuel.kgCO2).toBeGreaterThan(0);
  });

  it('RESOLU sans filière (CAPTEUR_DEFAILLANT) : CO₂ reste 0', () => {
    const sig = { type_signalement: 'CAPTEUR_DEFAILLANT', urgence: 'HAUTE', statut: 'RESOLU' };
    const imp = impactForSignalement(sig);
    expect(imp.resolu).toBe(true);
    expect(imp.actuel.kgTries).toBeGreaterThan(0);
    expect(imp.actuel.kgCO2).toBe(0);
    expect(imp.hasCO2Filiere).toBe(false);
  });

  it('null signalement → null', () => {
    expect(impactForSignalement(null)).toBeNull();
    expect(impactForSignalement(undefined)).toBeNull();
  });
});

describe('impactEstimation — aggregateImpact', () => {
  it('returns zeros for empty array', () => {
    expect(aggregateImpact([])).toEqual({
      count: 0,
      countValide: 0,
      countResolu: 0,
      kgTries: 0,
      kgCO2: 0,
    });
  });

  it('counts only VALIDE/RESOLU, ignores OUVERT', () => {
    const sigs = [
      { type_signalement: 'CONTENEUR_PLEIN', urgence: 'MOYENNE', statut: 'OUVERT' },
      { type_signalement: 'CONTENEUR_PLEIN', urgence: 'MOYENNE', statut: 'EN_COURS' },
      { type_signalement: 'CONTENEUR_PLEIN', urgence: 'MOYENNE', statut: 'RESOLU' },
    ];
    const agg = aggregateImpact(sigs);
    expect(agg.count).toBe(3);
    expect(agg.countValide).toBe(2);
    expect(agg.countResolu).toBe(1);
    expect(agg.kgTries).toBeGreaterThan(0);
    expect(agg.kgCO2).toBeGreaterThan(0);
  });

  it('CO₂ only from RESOLU with filière', () => {
    const sigs = [
      // RESOLU sans filière → kgTries oui, CO₂ non
      { type_signalement: 'CAPTEUR_DEFAILLANT', urgence: 'MOYENNE', statut: 'RESOLU' },
    ];
    const agg = aggregateImpact(sigs);
    expect(agg.countResolu).toBe(1);
    expect(agg.kgTries).toBeGreaterThan(0);
    expect(agg.kgCO2).toBe(0);
  });

  it('skips unknown type codes silently', () => {
    const sigs = [
      { type_signalement: 'UNKNOWN', urgence: 'HAUTE', statut: 'RESOLU' },
      { type_signalement: 'CONTENEUR_PLEIN', urgence: 'MOYENNE', statut: 'RESOLU' },
    ];
    const agg = aggregateImpact(sigs);
    // Both increment count; only the known one contributes kg.
    expect(agg.count).toBe(2);
    expect(agg.kgTries).toBeGreaterThan(0);
  });
});
