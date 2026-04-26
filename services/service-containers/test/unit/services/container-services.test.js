/**
 * Tests Unitaires - ContainerServices
 * Tests isolés de chaque méthode du service avec mocks
 */

const ContainerServices = require('../../../src/services/container-services');
const Validators = require('../../../src/utils/Validators');

// Mock des validateurs
jest.mock('../../../src/utils/Validators');

describe('ContainerServices - Unit Tests', () => {
  let containerService;
  let mockModel;
  let mockSocketService;

  beforeEach(() => {
    // Réinitialiser tous les mocks
    jest.clearAllMocks();
    
    // Mock du modèle
    mockModel = {
      createContainer: jest.fn(),
      updateContainer: jest.fn(),
      updateStatus: jest.fn(),
      getContainerById: jest.fn(),
      getContainerByUid: jest.fn(),
      getAllContainers: jest.fn(),
      getContainersByStatus: jest.fn(),
      getContainersByZone: jest.fn(),
      getContainersInRadius: jest.fn(),
      deleteContainer: jest.fn()
    };

    // Mock du service Socket.IO
    mockSocketService = {
      emitStatusChange: jest.fn()
    };

    containerService = new ContainerServices(mockModel, mockSocketService);
    
    // Réinitialiser les implémentations de Validators
    Validators.validateContainerData.mockClear();
    Validators.validateContainerId.mockClear();
    Validators.validateStatut.mockClear();
    Validators.validatePagination.mockClear();
    Validators.validateZoneId.mockClear();
    Validators.validateContainerUid.mockClear();
    Validators.validateCoordinates.mockClear();
    Validators.validateRadius.mockClear();
  });;;

  describe('createContainer', () => {
    it('devrait créer un conteneur avec des données valides', async () => {
      const containerData = {
        capacite_l: 100,
        statut: 'Vide',
        latitude: 48.8566,
        longitude: 2.3522
      };
      const expectedResult = { id: 1, ...containerData };

      mockModel.createContainer.mockResolvedValue(expectedResult);

      const result = await containerService.createContainer(containerData);

      expect(Validators.validateContainerData).toHaveBeenCalledWith(containerData);
      expect(mockModel.createContainer).toHaveBeenCalledWith(containerData);
      expect(result).toEqual(expectedResult);
    });

    it('devrait valider les données avant création', async () => {
      const invalidData = { capacite_l: -10 };
      
      const validationError = new Error('Invalid data');
      jest.spyOn(Validators, 'validateContainerData').mockImplementationOnce(() => {
        throw validationError;
      });

      await expect(containerService.createContainer(invalidData))
        .rejects.toThrow('Invalid data');
      
      expect(mockModel.createContainer).not.toHaveBeenCalled();
    });
  });

  describe('updateContainer', () => {
    it('devrait mettre à jour un conteneur', async () => {
      const id = 1;
      const updateData = { capacite_l: 150 };
      const expectedResult = { id, ...updateData };

      mockModel.updateContainer.mockResolvedValue(expectedResult);

      const result = await containerService.updateContainer(id, updateData);

      expect(Validators.validateContainerId).toHaveBeenCalledWith(id);
      expect(Validators.validateContainerData).toHaveBeenCalledWith(updateData, { isUpdate: true });
      expect(mockModel.updateContainer).toHaveBeenCalledWith(id, updateData);
      expect(result).toEqual(expectedResult);
    });

    it('devrait valider l\'ID et les données', async () => {
      jest.spyOn(Validators, 'validateContainerId').mockImplementationOnce(() => {
        throw new Error('Invalid ID');
      });

      await expect(containerService.updateContainer(null, {}))
        .rejects.toThrow('Invalid ID');
    });
  });

  describe('updateStatus', () => {
    it('devrait mettre à jour le statut et émettre événement Socket si statut changé', async () => {
      const id = 1;
      const statut = 'Plein';
      const mockResult = { changed: true, container: { id, statut } };
      const mockContainer = { id, id_zone: 5, statut };

      mockModel.updateStatus.mockResolvedValue(mockResult);
      mockModel.getContainerById.mockResolvedValue(mockContainer);

      const result = await containerService.updateStatus(id, statut);

      expect(Validators.validateStatut).toHaveBeenCalledWith(statut);
      expect(Validators.validateContainerId).toHaveBeenCalledWith(id);
      expect(mockModel.updateStatus).toHaveBeenCalledWith(id, statut);
      expect(mockSocketService.emitStatusChange).toHaveBeenCalledWith(5, mockResult);
      expect(result).toEqual(mockResult);
    });

    it('ne devrait pas émettre si le statut n\'a pas changé', async () => {
      const id = 1;
      const statut = 'Vide';
      const mockResult = { changed: false, container: { id, statut } };

      mockModel.updateStatus.mockResolvedValue(mockResult);

      await containerService.updateStatus(id, statut);

      expect(mockSocketService.emitStatusChange).not.toHaveBeenCalled();
    });

    it('ne devrait pas émettre si socketService est null', async () => {
      const serviceWithoutSocket = new ContainerServices(mockModel, null);
      const mockResult = { changed: true, container: { id: 1 } };

      mockModel.updateStatus.mockResolvedValue(mockResult);

      await serviceWithoutSocket.updateStatus(1, 'Plein');

      // Pas d'erreur levée, mais pas d'émission non plus
      expect(mockModel.updateStatus).toHaveBeenCalled();
    });

    it('devrait gérer les erreurs d\'émission Socket gracieusement', async () => {
      const mockResult = { changed: true, container: { id: 1 } };
      const mockContainer = { id: 1, id_zone: 5 };

      mockModel.updateStatus.mockResolvedValue(mockResult);
      mockModel.getContainerById.mockResolvedValue(mockContainer);
      mockSocketService.emitStatusChange.mockImplementation(() => {
        throw new Error('Socket emit failed');
      });

      // Ne devrait pas throw, juste logger l'erreur
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await containerService.updateStatus(1, 'Plein');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('getContainerById', () => {
    it('devrait récupérer un conteneur par ID', async () => {
      const id = 1;
      const mockContainer = { id, capacite_l: 100 };

      mockModel.getContainerById.mockResolvedValue(mockContainer);

      const result = await containerService.getContainerById(id);

      expect(Validators.validateContainerId).toHaveBeenCalledWith(id);
      expect(mockModel.getContainerById).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockContainer);
    });
  });

  describe('getContainerByUid', () => {
    it('devrait récupérer un conteneur par UID', async () => {
      const uid = 'abc-123';
      const mockContainer = { uid, capacite_l: 100 };

      mockModel.getContainerByUid.mockResolvedValue(mockContainer);

      const result = await containerService.getContainerByUid(uid);

      expect(Validators.validateContainerUid).toHaveBeenCalledWith(uid);
      expect(mockModel.getContainerByUid).toHaveBeenCalledWith(uid);
      expect(result).toEqual(mockContainer);
    });
  });

  describe('getAllContainers', () => {
    it('devrait récupérer tous les conteneurs avec pagination par défaut', async () => {
      const mockContainers = [{ id: 1 }, { id: 2 }];
      mockModel.getAllContainers.mockResolvedValue(mockContainers);

      const result = await containerService.getAllContainers();

      expect(Validators.validatePagination).toHaveBeenCalledWith(1, 50);
      expect(mockModel.getAllContainers).toHaveBeenCalledWith({ page: 1, limit: 50 });
      expect(result).toEqual(mockContainers);
    });

    it('devrait accepter des options de pagination personnalisées', async () => {
      const options = { page: 2, limit: 10 };
      mockModel.getAllContainers.mockResolvedValue([]);

      await containerService.getAllContainers(options);

      expect(Validators.validatePagination).toHaveBeenCalledWith(2, 10);
      expect(mockModel.getAllContainers).toHaveBeenCalledWith(options);
    });
  });

  describe('getContainersByStatus', () => {
    it('devrait récupérer les conteneurs par statut', async () => {
      const statut = 'Plein';
      const mockContainers = [{ id: 1, statut }];

      mockModel.getContainersByStatus.mockResolvedValue(mockContainers);

      const result = await containerService.getContainersByStatus(statut);

      expect(Validators.validateStatut).toHaveBeenCalledWith(statut);
      expect(mockModel.getContainersByStatus).toHaveBeenCalledWith(statut);
      expect(result).toEqual(mockContainers);
    });
  });

  describe('getContainersByZone', () => {
    it('devrait récupérer les conteneurs par zone', async () => {
      const idZone = 5;
      const mockContainers = [{ id: 1, id_zone: idZone }];

      mockModel.getContainersByZone.mockResolvedValue(mockContainers);

      const result = await containerService.getContainersByZone(idZone);

      expect(Validators.validateZoneId).toHaveBeenCalledWith(idZone);
      expect(mockModel.getContainersByZone).toHaveBeenCalledWith(idZone);
      expect(result).toEqual(mockContainers);
    });
  });

  describe('getContainersInRadius', () => {
    it('devrait récupérer les conteneurs dans un rayon', async () => {
      const latitude = 48.8566;
      const longitude = 2.3522;
      const radiusKm = 5;
      const mockContainers = [{ id: 1 }];

      mockModel.getContainersInRadius.mockResolvedValue(mockContainers);

      const result = await containerService.getContainersInRadius(latitude, longitude, radiusKm);

      expect(Validators.validateCoordinates).toHaveBeenCalledWith(latitude, longitude);
      expect(Validators.validateRadius).toHaveBeenCalledWith(radiusKm);
      expect(mockModel.getContainersInRadius).toHaveBeenCalledWith(latitude, longitude, radiusKm);
      expect(result).toEqual(mockContainers);
    });
  });

  describe('deleteContainer', () => {
    it('devrait supprimer un conteneur', async () => {
      const id = 1;
      mockModel.deleteContainer.mockResolvedValue({ success: true });

      const result = await containerService.deleteContainer(id);

      expect(Validators.validateContainerId).toHaveBeenCalledWith(id);
      expect(mockModel.deleteContainer).toHaveBeenCalledWith(id);
      expect(result).toEqual({ success: true });
    });
  });
});
