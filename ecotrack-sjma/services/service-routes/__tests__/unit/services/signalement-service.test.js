jest.mock('../../../kafkaProducer', () => ({
  sendSignalement: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../../src/utils/notifyStaff', () => ({
  notifyAllStaff: jest.fn().mockResolvedValue(undefined),
  notifyCitoyen: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../../src/repositories/signalement-repository', () => {
  return jest.fn().mockImplementation(() => ({
    create: jest.fn(),
    findConteneurByUidOrId: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    updateStatus: jest.fn(),
    update: jest.fn(),
    insertTreatment: jest.fn(),
    getHistory: jest.fn(),
    getStats: jest.fn(),
    getTypes: jest.fn()
  }));
});

const SignalementService = require('../../../src/services/signalement-service');
const SignalementRepository = require('../../../src/repositories/signalement-repository');

describe('SignalementService', () => {
  let service;
  let repo;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SignalementService({});
    repo = SignalementRepository.mock.results[0].value;
  });

  it('delegates getAll to repository', async () => {
    repo.findAll.mockResolvedValue({ data: [], pagination: { page: 1 } });

    const result = await service.getAll({ page: 1, limit: 10 });

    expect(repo.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
    expect(result).toEqual({ data: [], pagination: { page: 1 } });
  });

  it('throws badRequest for invalid status update', async () => {
    await expect(service.updateStatus(1, 'INVALID')).rejects.toMatchObject({ statusCode: 400 });
    expect(repo.findById).not.toHaveBeenCalled();
  });

  it('throws notFound when updating unknown signalement', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(service.updateStatus(42, 'RESOLU')).rejects.toMatchObject({ statusCode: 404 });
    expect(repo.updateStatus).not.toHaveBeenCalled();
  });

  it('adds default type_action NOTE when saving note-only treatment', async () => {
    repo.findById.mockResolvedValue({ id_signalement: 2 });
    repo.insertTreatment.mockResolvedValue({ id_traitement: 7, type_action: 'NOTE' });

    const payload = { id_agent: 8, commentaire: 'observed' };
    const result = await service.saveTreatment(2, payload);

    expect(repo.insertTreatment).toHaveBeenCalledWith(2, expect.objectContaining({ type_action: 'NOTE' }));
    expect(result).toEqual({ id_traitement: 7, type_action: 'NOTE' });
  });

  it('uses INTERVENTION type_action when intervention details are provided', async () => {
    repo.findById.mockResolvedValue({ id_signalement: 9 });
    repo.insertTreatment.mockResolvedValue({ id_traitement: 12, type_action: 'INTERVENTION' });

    await service.saveTreatment(9, { id_agent: 4, type_intervention: 'collecte', notes_intervention: 'ok' });

    expect(repo.insertTreatment).toHaveBeenCalledWith(
      9,
      expect.objectContaining({ type_action: 'INTERVENTION' })
    );
  });

  it('throws badRequest when treatment data has no actionable fields', async () => {
    repo.findById.mockResolvedValue({ id_signalement: 9 });

    await expect(service.saveTreatment(9, { id_agent: 4 })).rejects.toMatchObject({ statusCode: 400 });
    expect(repo.insertTreatment).not.toHaveBeenCalled();
  });

  describe('create validation', () => {
    it('lists only the actually missing fields', async () => {
      await expect(
        service.create({ description: 'bac plein', id_type: 1, id_citoyen: 5 })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'Champs requis manquants : id_conteneur',
      });
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('lists several missing fields in canonical order', async () => {
      await expect(service.create({})).rejects.toMatchObject({
        statusCode: 400,
        message: 'Champs requis manquants : description, id_type, id_conteneur, id_citoyen',
      });
    });

    it('treats empty strings as missing', async () => {
      await expect(
        service.create({ description: '   ', id_type: 1, id_conteneur: 3, id_citoyen: 5 })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'Champs requis manquants : description',
      });
    });

    it('creates the signalement when all required fields are present', async () => {
      const db = { query: jest.fn().mockResolvedValue({ rows: [] }) };
      service = new SignalementService(db);
      repo = SignalementRepository.mock.results[SignalementRepository.mock.results.length - 1].value;
      repo.create.mockResolvedValue({ id_signalement: 11 });

      const result = await service.create({
        description: 'bac plein',
        id_type: 1,
        id_conteneur: 3,
        id_citoyen: 5,
        urgence: 'MOYENNE',
      });

      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
        description: 'bac plein',
        id_type: 1,
        id_conteneur: 3,
        id_citoyen: 5,
      }));
      expect(result).toEqual({ id_signalement: 11 });
    });

    it('resolves conteneur_uid to id_conteneur when id_conteneur is absent', async () => {
      const db = { query: jest.fn().mockResolvedValue({ rows: [] }) };
      service = new SignalementService(db);
      repo = SignalementRepository.mock.results[SignalementRepository.mock.results.length - 1].value;
      repo.findConteneurByUidOrId.mockResolvedValue({ id_conteneur: 42 });
      repo.create.mockResolvedValue({ id_signalement: 13 });

      const result = await service.create({
        description: 'dépôt sauvage',
        id_type: 2,
        conteneur_uid: 'CNT-ZZZ999',
        id_citoyen: 7,
      });

      expect(repo.findConteneurByUidOrId).toHaveBeenCalledWith('CNT-ZZZ999');
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ id_conteneur: 42 }));
      expect(result).toEqual({ id_signalement: 13 });
    });

    it('rejects with Conteneur introuvable when the uid does not resolve', async () => {
      repo.findConteneurByUidOrId.mockResolvedValue(null);

      await expect(
        service.create({ description: 'x', id_type: 1, conteneur_uid: 'CNT-UNKNOWN', id_citoyen: 3 })
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'Conteneur introuvable — vérifiez l’identifiant saisi ou scannez le QR code.',
      });
      expect(repo.create).not.toHaveBeenCalled();
    });
  });
});