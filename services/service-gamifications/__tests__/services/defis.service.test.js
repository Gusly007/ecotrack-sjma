import { jest } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../../src/config/database.js', () => ({
  __esModule: true,
  default: {
    query: mockQuery
  }
}));

const {
  creerDefi,
  listerDefis,
  creerParticipation,
  mettreAJourProgression
} = await import('../../src/services/defis.service.js');

describe('defis.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('creerDefi', () => {
    it('cree un defi avec tous les champs', async () => {
      const defiMock = {
        id_defi: 1,
        titre: 'Defi Test',
        description: 'Description',
        objectif: 10,
        recompense_points: 50,
        date_debut: '2026-01-01',
        date_fin: '2026-01-31',
        type_defi: 'INDIVIDUEL'
      };
      mockQuery.mockResolvedValue({ rows: [defiMock] });

      const result = await creerDefi({
        titre: 'Defi Test',
        description: 'Description',
        objectif: 10,
        recompensePoints: 50,
        dateDebut: '2026-01-01',
        dateFin: '2026-01-31',
        typeDefi: 'INDIVIDUEL'
      });

      expect(result).toEqual(defiMock);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO gamification_defi'),
        expect.arrayContaining(['Defi Test', 'Description', 10, 50, '2026-01-01', '2026-01-31', 'INDIVIDUEL'])
      );
    });
  });

  describe('listerDefis', () => {
    it('retourne liste des defis ordonnee par date', async () => {
      const defisMock = [
        { id_defi: 1, titre: 'Defi 1', date_debut: '2026-02-01' },
        { id_defi: 2, titre: 'Defi 2', date_debut: '2026-01-01' }
      ];
      mockQuery.mockResolvedValue({ rows: defisMock });

      const result = await listerDefis();

      expect(result).toEqual(defisMock);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY date_debut DESC')
      );
    });

    it('retourne tableau vide si aucun defi', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await listerDefis();

      expect(result).toEqual([]);
    });
  });

  describe('creerParticipation', () => {
    it('cree une participation', async () => {
      const participationMock = {
        id_participation: 1,
        id_defi: 1,
        id_utilisateur: 1,
        progression: 0,
        statut: 'EN_COURS'
      };
      mockQuery.mockResolvedValue({ rows: [participationMock] });

      const result = await creerParticipation({
        idDefi: 1,
        idUtilisateur: 1
      });

      expect(result).toEqual(participationMock);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO gamification_participation_defi'),
        [1, 1]
      );
    });
  });

  describe('mettreAJourProgression', () => {
    it('met a jour progression et statut', async () => {
      const participationMock = {
        id_participation: 1,
        id_defi: 1,
        id_utilisateur: 1,
        progression: 50,
        statut: 'EN_COURS'
      };
      mockQuery.mockResolvedValue({ rows: [participationMock] });

      const result = await mettreAJourProgression({
        idDefi: 1,
        idUtilisateur: 1,
        progression: 50,
        statut: 'EN_COURS'
      });

      expect(result).toEqual(participationMock);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE gamification_participation_defi'),
        [50, 'EN_COURS', 1, 1]
      );
    });

    it('met a jour progression sans changer statut', async () => {
      const participationMock = {
        id_participation: 1,
        progression: 75,
        statut: 'EN_COURS'
      };
      mockQuery.mockResolvedValue({ rows: [participationMock] });

      const result = await mettreAJourProgression({
        idDefi: 1,
        idUtilisateur: 1,
        progression: 75
      });

      expect(result).toEqual(participationMock);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('COALESCE'),
        [75, undefined, 1, 1]
      );
    });
  });
});
