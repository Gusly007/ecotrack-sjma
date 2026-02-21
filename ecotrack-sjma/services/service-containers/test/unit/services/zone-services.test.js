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
      deleteZone: jest.fn()
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

      const result = await zoneService.getAllZones();

      expect(mockModel.getAllZones).toHaveBeenCalled();
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

});
