/**
 * Tests Socket.IO - Service Integration
 * Tests pour vérifier que SocketService fonctionne avec ContainerServices
 */

const ContainerServices = require('../services/container-services');

describe('SocketService - Integration with ContainerServices', () => {
  let containerServices;
  let mockContainerModel;
  let mockSocketService;

  beforeEach(() => {
    // Mock le ContainerModel
    mockContainerModel = {
      updateStatus: jest.fn().mockResolvedValue({
        changed: true,
        id_conteneur: 1,
        ancien_statut: 'ACTIF',
        nouveau_statut: 'INACTIF'
      }),
      getContainerById: jest.fn().mockResolvedValue({
        id_conteneur: 1,
        uid: 'CNT-123456789',
        id_zone: 1,
        statut: 'INACTIF'
      })
    };

    // Mock le SocketService
    mockSocketService = {
      emitStatusChange: jest.fn(),
      emit: jest.fn(),
      emitToRoom: jest.fn(),
      getIO: jest.fn()
    };

    // Créer le ContainerServices avec les mocks
    containerServices = new ContainerServices(mockContainerModel, mockSocketService);
  });

  describe('updateStatus avec Socket.IO', () => {
    it('should call model.updateStatus', async () => {
      const id = 1;
      const statut = 'INACTIF';

      await containerServices.updateStatus(id, statut);

      expect(mockContainerModel.updateStatus).toHaveBeenCalledWith(id, statut);
    });

    it('should emit socket event when status changes', async () => {
      const id = 1;
      const statut = 'INACTIF';

      const result = await containerServices.updateStatus(id, statut);

      expect(mockSocketService.emitStatusChange).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          changed: true,
          id_conteneur: 1
        })
      );
    });

    it('should not emit socket event if status did not change', async () => {
      mockContainerModel.updateStatus.mockResolvedValue({
        changed: false,
        id_conteneur: 1
      });

      await containerServices.updateStatus(1, 'ACTIF');

      expect(mockSocketService.emitStatusChange).not.toHaveBeenCalled();
    });

    it('should handle socket service not available gracefully', async () => {
      containerServices = new ContainerServices(mockContainerModel, null);

      const result = await containerServices.updateStatus(1, 'INACTIF');

      expect(result.changed).toBe(true);
      expect(mockContainerModel.updateStatus).toHaveBeenCalled();
    });

    it('should catch and log socket errors gracefully', async () => {
      mockSocketService.emitStatusChange.mockImplementation(() => {
        throw new Error('Socket error');
      });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await containerServices.updateStatus(1, 'INACTIF');

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(result.changed).toBe(true); // Result still returned despite error

      consoleErrorSpy.mockRestore();
    });

    it('should not emit if container has no id_zone', async () => {
      mockContainerModel.getContainerById.mockResolvedValue({
        id_conteneur: 1,
        uid: 'CNT-123456789',
        id_zone: null,
        statut: 'INACTIF'
      });

      await containerServices.updateStatus(1, 'INACTIF');

      expect(mockSocketService.emitStatusChange).not.toHaveBeenCalled();
    });
  });

  describe('Other methods without Socket', () => {
    it('should create container without socket', async () => {
      mockContainerModel.createContainer = jest.fn().mockResolvedValue({
        id_conteneur: 1,
        uid: 'CNT-123456789'
      });

      const result = await containerServices.createContainer({
        capacite_l: 1200,
        statut: 'ACTIF',
        latitude: 48.8566,
        longitude: 2.3522,
        id_zone: 1
      });

      expect(mockContainerModel.createContainer).toHaveBeenCalled();
      expect(result.id_conteneur).toBe(1);
      // Pas d'appel socket pour createContainer
      expect(mockSocketService.emitStatusChange).not.toHaveBeenCalled();
    });

    it('should get container without socket', async () => {
      mockContainerModel.getContainerById = jest.fn().mockResolvedValue({
        id_conteneur: 1,
        uid: 'CNT-123456789'
      });

      const result = await containerServices.getContainerById(1);

      expect(mockContainerModel.getContainerById).toHaveBeenCalledWith(1);
      expect(mockSocketService.emitStatusChange).not.toHaveBeenCalled();
    });
  });
});
