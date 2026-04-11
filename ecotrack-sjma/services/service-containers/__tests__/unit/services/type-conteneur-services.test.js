/**
 * Tests Unitaires - TypeConteneurServices
 * Tests isolés du service de types de conteneurs
 */

const TypeConteneurServices = require('../../../src/services/type-conteneur-services');
const Validators = require('../../../src/utils/Validators');

jest.mock('../../../src/utils/Validators');

describe('TypeConteneurServices - Unit Tests', () => {
  let typeService;
  let mockModel;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockModel = {
      createTypeConteneur: jest.fn(),
      getAllTypes: jest.fn(),
      getTypeById: jest.fn(),
      getTypeByCode: jest.fn(),
      getTypeByNom: jest.fn(),
      updateTypeConteneur: jest.fn(),
      deleteTypeConteneur: jest.fn(),
      deleteAllTypes: jest.fn(),
      countTypes: jest.fn(),
      typeExists: jest.fn(),
      codeExists: jest.fn(),
      countContainersByType: jest.fn(),
      getTypeWithStats: jest.fn(),
      getAllTypesWithStats: jest.fn()
    };

    typeService = new TypeConteneurServices(mockModel);
  });

  describe('getAllTypes', () => {
    it('devrait récupérer tous les types de conteneurs', async () => {
      const mockTypes = [
        { code: 'OM', nom: 'Ordures Ménagères' },
        { code: 'TRI', nom: 'Tri Sélectif' }
      ];

      mockModel.getAllTypes.mockResolvedValue(mockTypes);

      const result = await typeService.getAllTypes();

      expect(mockModel.getAllTypes).toHaveBeenCalled();
      expect(result).toEqual(mockTypes);
    });
  });

  describe('getTypeById', () => {
    it('devrait récupérer un type par ID', async () => {
      const mockType = { id: 1, code: 'OM', nom: 'Ordures Ménagères' };
      mockModel.getTypeById.mockResolvedValue(mockType);

      const result = await typeService.getTypeById(1);

      expect(Validators.validateTypeConteneurId).toHaveBeenCalledWith(1);
      expect(mockModel.getTypeById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockType);
    });
  });

  describe('getTypeByCode', () => {
    it('devrait récupérer un type par code', async () => {
      const mockType = { code: 'OM', nom: 'Ordures Ménagères' };
      mockModel.getTypeByCode.mockResolvedValue(mockType);

      const result = await typeService.getTypeByCode('OM');

      expect(Validators.validateCode).toHaveBeenCalledWith('OM', 'code');
      expect(mockModel.getTypeByCode).toHaveBeenCalledWith('OM');
      expect(result).toEqual(mockType);
    });
  });

  describe('getTypeByNom', () => {
    it('devrait récupérer un type par nom', async () => {
      const mockType = { code: 'OM', nom: 'Ordures Ménagères' };
      mockModel.getTypeByNom.mockResolvedValue(mockType);

      const result = await typeService.getTypeByNom('Ordures Ménagères');

      expect(Validators.validateTypeConteneurNom).toHaveBeenCalledWith('Ordures Ménagères');
      expect(mockModel.getTypeByNom).toHaveBeenCalledWith('Ordures Ménagères');
      expect(result).toEqual(mockType);
    });
  });

  describe('createTypeConteneur', () => {
    it('devrait valider puis créer un type', async () => {
      const payload = { code: 'OM', nom: 'Ordures' };
      mockModel.createTypeConteneur.mockResolvedValue({ id: 1, ...payload });

      const result = await typeService.createTypeConteneur(payload);

      expect(Validators.validateTypeConteneurData).toHaveBeenCalledWith(payload);
      expect(mockModel.createTypeConteneur).toHaveBeenCalledWith(payload);
      expect(result.id).toBe(1);
    });
  });

  describe('updateTypeConteneur', () => {
    it('devrait valider id et payload puis mettre à jour', async () => {
      const payload = { nom: 'Nouveau nom' };
      mockModel.updateTypeConteneur.mockResolvedValue({ id: 2, ...payload });

      const result = await typeService.updateTypeConteneur(2, payload);

      expect(Validators.validateTypeConteneurId).toHaveBeenCalledWith(2);
      expect(Validators.validateTypeConteneurData).toHaveBeenCalledWith(payload, { isUpdate: true });
      expect(mockModel.updateTypeConteneur).toHaveBeenCalledWith(2, payload);
      expect(result.id).toBe(2);
    });
  });

  describe('delete and counters', () => {
    it('deleteTypeConteneur valide id puis supprime', async () => {
      mockModel.deleteTypeConteneur.mockResolvedValue({ ok: true });
      const result = await typeService.deleteTypeConteneur(3);
      expect(Validators.validateTypeConteneurId).toHaveBeenCalledWith(3);
      expect(mockModel.deleteTypeConteneur).toHaveBeenCalledWith(3);
      expect(result).toEqual({ ok: true });
    });

    it('deleteAllTypes et countTypes délèguent au repository', async () => {
      mockModel.deleteAllTypes.mockResolvedValue([{ id: 1 }]);
      mockModel.countTypes.mockResolvedValue(5);

      const deleted = await typeService.deleteAllTypes();
      const count = await typeService.countTypes();

      expect(deleted).toEqual([{ id: 1 }]);
      expect(count).toBe(5);
    });
  });

  describe('existence and stats methods', () => {
    it('typeExists et codeExists valident puis délèguent', async () => {
      mockModel.typeExists.mockResolvedValue(true);
      mockModel.codeExists.mockResolvedValue(false);

      const byId = await typeService.typeExists(9);
      const byCode = await typeService.codeExists('TRI');

      expect(Validators.validateTypeConteneurId).toHaveBeenCalledWith(9);
      expect(Validators.validateCode).toHaveBeenCalledWith('TRI', 'code');
      expect(byId).toBe(true);
      expect(byCode).toBe(false);
    });

    it('countContainersByType, getTypeWithStats et getAllTypesWithStats', async () => {
      mockModel.countContainersByType.mockResolvedValue(12);
      mockModel.getTypeWithStats.mockResolvedValue({ id: 2, total: 12 });
      mockModel.getAllTypesWithStats.mockResolvedValue([{ id: 2, total: 12 }]);

      const total = await typeService.countContainersByType(2);
      const one = await typeService.getTypeWithStats(2);
      const all = await typeService.getAllTypesWithStats();

      expect(Validators.validateTypeConteneurId).toHaveBeenCalledWith(2);
      expect(total).toBe(12);
      expect(one).toEqual({ id: 2, total: 12 });
      expect(all).toEqual([{ id: 2, total: 12 }]);
    });
  });
});
