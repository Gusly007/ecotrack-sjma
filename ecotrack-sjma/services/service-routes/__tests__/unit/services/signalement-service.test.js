jest.mock('../../../src/repositories/signalement-repository', () => {
  return jest.fn().mockImplementation(() => ({
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
});