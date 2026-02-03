/**
 * Tests Unitaires - TypeConteneurServices
 * Tests isolés du service de types de conteneurs
 */

const TypeConteneurServices = require('../../src/services/type-conteneur-services');

describe('TypeConteneurServices - Unit Tests', () => {
  let typeService;
  let mockModel;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockModel = {
      getAll: jest.fn(),
      getByCode: jest.fn(),
      getAllWithStats: jest.fn()
    };

    typeService = new TypeConteneurServices(mockModel);
  });

  describe('getAll', () => {
    it('devrait récupérer tous les types de conteneurs', async () => {
      const mockTypes = [
        { code: 'OM', nom: 'Ordures Ménagères' },
        { code: 'TRI', nom: 'Tri Sélectif' }
      ];

      mockModel.getAll.mockResolvedValue(mockTypes);

      const result = await typeService.getAll();

      expect(mockModel.getAll).toHaveBeenCalled();
      expect(result).toEqual(mockTypes);
    });

    it('devrait retourner un tableau vide si aucun type', async () => {
      mockModel.getAll.mockResolvedValue([]);

      const result = await typeService.getAll();

      expect(result).toEqual([]);
    });
  });

  describe('getByCode', () => {
    it('devrait récupérer un type par son code', async () => {
      const code = 'OM';
      const mockType = { code, nom: 'Ordures Ménagères' };

      mockModel.getByCode.mockResolvedValue(mockType);

      const result = await typeService.getByCode(code);

      expect(mockModel.getByCode).toHaveBeenCalledWith(code);
      expect(result).toEqual(mockType);
    });

    it('devrait retourner null si type non trouvé', async () => {
      mockModel.getByCode.mockResolvedValue(null);

      const result = await typeService.getByCode('INVALID');

      expect(result).toBeNull();
    });
  });

  describe('getAllWithStats', () => {
    it('devrait récupérer tous les types avec statistiques', async () => {
      const mockTypesWithStats = [
        { code: 'OM', nom: 'Ordures Ménagères', nb_conteneurs: 10 },
        { code: 'TRI', nom: 'Tri Sélectif', nb_conteneurs: 5 }
      ];

      mockModel.getAllWithStats.mockResolvedValue(mockTypesWithStats);

      const result = await typeService.getAllWithStats();

      expect(mockModel.getAllWithStats).toHaveBeenCalled();
      expect(result).toEqual(mockTypesWithStats);
    });
  });
});
