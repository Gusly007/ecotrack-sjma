import { describe, expect, it } from 'vitest';
import {
  buildInitialCreateForm,
  getDefaultHeureDebut,
  isDepartPasse,
  toLocalIsoDate,
} from '../utils/heureDepart';

const at = (h, m, day = 9) => new Date(2026, 10, day, h, m, 0);

describe('Heure de départ par défaut', () => {
  it('prend le quart d\'heure suivant pour aujourd\'hui', () => {
    expect(getDefaultHeureDebut('2026-11-09', at(15, 2))).toBe('15:15');
    expect(getDefaultHeureDebut('2026-11-09', at(15, 0))).toBe('15:15');
    expect(getDefaultHeureDebut('2026-11-09', at(6, 50))).toBe('07:00');
  });

  it('garde 07:30 pour une date future', () => {
    expect(getDefaultHeureDebut('2026-11-10', at(15, 2))).toBe('07:30');
  });

  it('bascule au lendemain 07:30 quand il ne reste aucun créneau aujourd\'hui', () => {
    expect(buildInitialCreateForm(at(23, 50))).toMatchObject({
      date_tournee: '2026-11-10',
      heure_debut_prevue: '07:30',
    });
    expect(buildInitialCreateForm(at(15, 2))).toMatchObject({
      date_tournee: '2026-11-09',
      heure_debut_prevue: '15:15',
    });
  });

  it('utilise la date locale, pas la date UTC', () => {
    expect(toLocalIsoDate(new Date(2026, 10, 10, 0, 30))).toBe('2026-11-10');
  });

  it('détecte un départ déjà passé', () => {
    expect(isDepartPasse('2026-11-09', '07:30', at(15, 2))).toBe(true);
    expect(isDepartPasse('2026-11-09', '15:15', at(15, 2))).toBe(false);
    expect(isDepartPasse('2026-11-08', '18:00', at(15, 2))).toBe(true);
    expect(isDepartPasse('2026-11-10', '07:30', at(15, 2))).toBe(false);
  });
});
