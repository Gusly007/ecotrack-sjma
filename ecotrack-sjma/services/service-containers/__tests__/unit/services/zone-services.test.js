/**
 * Tests Unitaires - ZoneServices
 * Tests isolés de chaque méthode du service des zones
 */

const ZoneServices = require('../../../src/services/zone-services');
const Validators = require('../../../src/utils/Validators');

jest.mock('../../../src/utils/Validators');

describe('ZoneServices - Unit Tests', () => {
  let zoneService;
  let mockModel;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockModel = {
      addZone: jest.fn(),
      getAllZones: jest.fn(),
      getZoneById: jest.fn(),
      getZoneByCode: jest.fn(),
      updateZone: jest.fn(),
      deleteZone: jest.fn(),
      deleteAllZones: jest.fn(),
      searchZonesByName: jest.fn(),
      getZonesInRadius: jest.fn(),
      getZoneStatistics: jest.fn(),
      countZones: jest.fn(),
      zoneExists: jest.fn(),
      codeExists: jest.fn()
    };

    zoneService = new ZoneServices(mockModel);
    
    // Réinitialiser les implémentations de Validators
    Validators.validateZoneData.mockClear();
    Validators.validateZoneId.mockClear();
    Validators.validatePagination.mockClear();
    Validators.validateCode.mockClear();
  });

  describe('createZone', () => {
    it('devrait créer une zone avec des données valides', async () => {
      const zoneData = {
        nom: 'Zone Test',
        type: 'Résidentielle',
        code_postal: '75001'
      };
      const expectedResult = { id: 1, ...zoneData };

      mockModel.addZone.mockResolvedValue(expectedResult);

      const result = await zoneService.createZone(zoneData);

      expect(Validators.validateZoneData).toHaveBeenCalledWith(zoneData);
      expect(mockModel.addZone).toHaveBeenCalledWith(zoneData);
      expect(result).toEqual(expectedResult);
    });

    it('devrait valider les données avant création', async () => {
      jest.spyOn(Validators, 'validateZoneData').mockImplementationOnce(() => {
        throw new Error('Invalid zone data');
      });

      await expect(zoneService.createZone({}))
        .rejects.toThrow('Invalid zone data');
      
      expect(mockModel.addZone).not.toHaveBeenCalled();
    });
  });

  describe('getAllZones', () => {
    it('devrait récupérer toutes les zones', async () => {
      const mockZones = [
        { id: 1, nom: 'Zone 1' },
        { id: 2, nom: 'Zone 2' }
      ];

      mockModel.getAllZones.mockResolvedValue(mockZones);

      const result = await zoneService.getAllZones(1, 10);

      expect(Validators.validatePagination).toHaveBeenCalledWith(1, 10);
      expect(mockModel.getAllZones).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual(mockZones);
    });
  });

  describe('getZoneById', () => {
    it('devrait récupérer une zone par ID', async () => {
      const id = 1;
      const mockZone = { id, nom: 'Zone Test' };

      mockModel.getZoneById.mockResolvedValue(mockZone);

      const result = await zoneService.getZoneById(id);

      expect(Validators.validateZoneId).toHaveBeenCalledWith(id);
      expect(mockModel.getZoneById).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockZone);
    });
  });

  describe('updateZone', () => {
    it('devrait mettre à jour une zone', async () => {
      const id = 1;
      const updateData = { nom: 'Nouveau nom' };
      const expectedResult = { id, ...updateData };

      mockModel.updateZone.mockResolvedValue(expectedResult);

      const result = await zoneService.updateZone(id, updateData);

      expect(Validators.validateZoneId).toHaveBeenCalledWith(id);
      expect(Validators.validateZoneData).toHaveBeenCalledWith(updateData, { isUpdate: true });
      expect(mockModel.updateZone).toHaveBeenCalledWith(id, updateData);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('deleteZone', () => {
    it('devrait supprimer une zone', async () => {
      const id = 1;
      mockModel.deleteZone.mockResolvedValue({ success: true });

      const result = await zoneService.deleteZone(id);

      expect(Validators.validateZoneId).toHaveBeenCalledWith(id);
      expect(mockModel.deleteZone).toHaveBeenCalledWith(id);
      expect(result).toEqual({ success: true });
    });
  });

  describe('other delegated methods', () => {
    it('getZoneByCode valide code puis délègue', async () => {
      mockModel.getZoneByCode.mockResolvedValue({ code: 'ZN01' });
      const result = await zoneService.getZoneByCode('ZN01');
      expect(Validators.validateCode).toHaveBeenCalledWith('ZN01', 'code');
      expect(mockModel.getZoneByCode).toHaveBeenCalledWith('ZN01');
      expect(result).toEqual({ code: 'ZN01' });
    });

    it('deleteAllZones délègue', async () => {
      mockModel.deleteAllZones.mockResolvedValue([{ id: 1 }]);
      const result = await zoneService.deleteAllZones();
      expect(result).toEqual([{ id: 1 }]);
    });

    it('searchZonesByName valide et délègue', async () => {
      mockModel.searchZonesByName.mockResolvedValue([{ id: 2 }]);
      const result = await zoneService.searchZonesByName('Centre');
      expect(Validators.validateNonEmptyString).toHaveBeenCalledWith('Centre', 'nom', 2);
      expect(mockModel.searchZonesByName).toHaveBeenCalledWith('Centre');
      expect(result).toEqual([{ id: 2 }]);
    });

    it('getZonesInRadius valide coordonnées et rayon', async () => {
      mockModel.getZonesInRadius.mockResolvedValue([{ id: 3 }]);
      const result = await zoneService.getZonesInRadius(48.8, 2.3, 10);
      expect(Validators.validateCoordinates).toHaveBeenCalledWith(48.8, 2.3);
      expect(Validators.validateRadius).toHaveBeenCalledWith(10);
      expect(mockModel.getZonesInRadius).toHaveBeenCalledWith(48.8, 2.3, 10);
      expect(result).toEqual([{ id: 3 }]);
    });

    it('stats/count/existence methods délèguent', async () => {
      mockModel.getZoneStatistics.mockResolvedValue({ total: 1 });
      mockModel.countZones.mockResolvedValue({ total: 1 });
      mockModel.zoneExists.mockResolvedValue(true);
      mockModel.codeExists.mockResolvedValue(false);

      const stats = await zoneService.getZoneStatistics();
      const count = await zoneService.countZones();
      const exists = await zoneService.zoneExists(9);
      const codeExists = await zoneService.codeExists('ZNX');

      expect(Validators.validateZoneId).toHaveBeenCalledWith(9);
      expect(Validators.validateCode).toHaveBeenCalledWith('ZNX', 'code');
      expect(stats).toEqual({ total: 1 });
      expect(count).toEqual({ total: 1 });
      expect(exists).toBe(true);
      expect(codeExists).toBe(false);
    });
  });

});
