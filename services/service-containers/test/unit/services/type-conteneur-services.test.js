/**
 * Tests Unitaires - TypeConteneurServices
 * Tests isolés du service de types de conteneurs
 */

const TypeConteneurServices = require('../../src/services/type-conteneur-services');
const Validators = require('../../src/utils/Validators');

jest.mock('../../src/utils/Validators');

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
      deleteTypeConteneur: jest.fn()
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
});
