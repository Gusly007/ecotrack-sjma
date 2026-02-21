import { jest } from '@jest/globals';

const mockCreerDefi = jest.fn();
const mockListerDefis = jest.fn();
const mockCreerParticipation = jest.fn();
const mockMettreAJourProgression = jest.fn();

jest.unstable_mockModule('../../src/services/defis.service.js', () => ({
  creerDefi: mockCreerDefi,
  listerDefis: mockListerDefis,
  creerParticipation: mockCreerParticipation,
  mettreAJourProgression: mockMettreAJourProgression
}));

const {
  creerDefiHandler,
  listerDefisHandler,
  creerParticipationHandler,
  mettreAJourProgressionHandler
} = await import('../../src/controllers/defisController.js');

const mockRequest = ({ body = {}, params = {} } = {}) => ({
  body,
  params
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('defisController', () => {
  const next = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('creerDefiHandler', () => {
    it('cree un defi avec donnees valides', async () => {
      const defiMock = {
        id_defi: 1,
        titre: 'Defi Test',
        description: 'Description test',
        objectif: 10,
        recompense_points: 50
      };
      mockCreerDefi.mockResolvedValue(defiMock);

      const req = mockRequest({
        body: {
          titre: 'Defi Test',
          description: 'Description test',
          objectif: 10,
          recompense_points: 50,
          date_debut: '2026-01-01',
          date_fin: '2026-01-31'
        }
      });
      const res = mockResponse();

      await creerDefiHandler(req, res, next);

      expect(mockCreerDefi).toHaveBeenCalledWith({
        titre: 'Defi Test',
        description: 'Description test',
        objectif: 10,
        recompensePoints: 50,
        dateDebut: expect.any(Date),
        dateFin: expect.any(Date),
        typeDefi: 'INDIVIDUEL'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(defiMock);
    });

    it('retourne erreur si donnees invalides', async () => {
      const req = mockRequest({
        body: {
          titre: 'AB',
          objectif: -1,
          date_debut: '2026-01-01',
          date_fin: '2026-01-31'
        }
      });
      const res = mockResponse();

      await creerDefiHandler(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalledWith(201);
    });

    it('retourne erreur si date_fin avant date_debut', async () => {
      const req = mockRequest({
        body: {
          titre: 'Defi Test',
          objectif: 10,
          date_debut: '2026-02-01',
          date_fin: '2026-01-01'
        }
      });
      const res = mockResponse();

      await creerDefiHandler(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('listerDefisHandler', () => {
    it('liste tous les defis', async () => {
      const defisMock = [
        { id_defi: 1, titre: 'Defi 1' },
        { id_defi: 2, titre: 'Defi 2' }
      ];
      mockListerDefis.mockResolvedValue(defisMock);

      const req = mockRequest();
      const res = mockResponse();

      await listerDefisHandler(req, res, next);

      expect(mockListerDefis).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(defisMock);
    });

    it('appelle next en cas d_erreur', async () => {
      mockListerDefis.mockRejectedValue(new Error('DB Error'));

      const req = mockRequest();
      const res = mockResponse();

      await listerDefisHandler(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('creerParticipationHandler', () => {
    it('cree une participation', async () => {
      const participationMock = {
        id_participation: 1,
        id_defi: 1,
        id_utilisateur: 1
      };
      mockCreerParticipation.mockResolvedValue(participationMock);

      const req = mockRequest({
        params: { idDefi: '1' },
        body: { id_utilisateur: 1 }
      });
      const res = mockResponse();

      await creerParticipationHandler(req, res, next);

      expect(mockCreerParticipation).toHaveBeenCalledWith({
        idDefi: 1,
        idUtilisateur: 1
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(participationMock);
    });

    it('retourne erreur si id_defi invalide', async () => {
      const req = mockRequest({
        params: { idDefi: 'invalid' },
        body: { id_utilisateur: 1 }
      });
      const res = mockResponse();

      await creerParticipationHandler(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('mettreAJourProgressionHandler', () => {
    it('met a jour la progression', async () => {
      const participationMock = {
        id_participation: 1,
        id_defi: 1,
        id_utilisateur: 1,
        progression: 50,
        statut: 'EN_COURS'
      };
      mockMettreAJourProgression.mockResolvedValue(participationMock);

      const req = mockRequest({
        params: { idDefi: '1', idUtilisateur: '1' },
        body: { progression: 50, statut: 'EN_COURS' }
      });
      const res = mockResponse();

      await mettreAJourProgressionHandler(req, res, next);

      expect(mockMettreAJourProgression).toHaveBeenCalledWith({
        idDefi: 1,
        idUtilisateur: 1,
        progression: 50,
        statut: 'EN_COURS'
      });
      expect(res.json).toHaveBeenCalledWith(participationMock);
    });

    it('met a jour sans statut optionnel', async () => {
      const participationMock = {
        id_participation: 1,
        progression: 75
      };
      mockMettreAJourProgression.mockResolvedValue(participationMock);

      const req = mockRequest({
        params: { idDefi: '1', idUtilisateur: '1' },
        body: { progression: 75 }
      });
      const res = mockResponse();

      await mettreAJourProgressionHandler(req, res, next);

      expect(mockMettreAJourProgression).toHaveBeenCalledWith({
        idDefi: 1,
        idUtilisateur: 1,
        progression: 75,
        statut: undefined
      });
    });

    it('retourne erreur si progression negative', async () => {
      const req = mockRequest({
        params: { idDefi: '1', idUtilisateur: '1' },
        body: { progression: -10 }
      });
      const res = mockResponse();

      await mettreAJourProgressionHandler(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
