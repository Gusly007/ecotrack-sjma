/**
 * Tests Intégration - Socket.IO avec ContainerService
 * Tests que les événements Socket sont émis lors du changement de statut
 */

const ContainerServices = require('../src/services/containerservices');

describe('ContainerServices - Socket.IO Integration', () => {
  let containerService;
  let mockModel;
  let mockSocketService;

  beforeEach(() => {
    // Mock du modèle
    mockModel = {
      updateStatus: jest.fn(),
      getContainerById: jest.fn()
    };

    // Mock du Socket Service
    mockSocketService = {
      emitStatusChange: jest.fn()
    };

    // Créer le service avec les mocks
    containerService = new ContainerServices(mockModel, mockSocketService);
  });

  describe('updateStatus with Socket.IO', () => {
    it('should emit status change when status is updated', async () => {
      const containerId = 1;
      const newStatus = 'EN_MAINTENANCE';

      // Mock le résultat d'updateStatus
      mockModel.updateStatus.mockResolvedValue({
        id_conteneur: 1,
        uid: 'CNT-123456789',
        statut: 'EN_MAINTENANCE',
        ancien_statut: 'ACTIF',
        changed: true
      });

      // Mock le conteneur avec la zone
      mockModel.getContainerById.mockResolvedValue({
        id_conteneur: 1,
        uid: 'CNT-123456789',
        statut: 'EN_MAINTENANCE',
        id_zone: 1
      });

      const result = await containerService.updateStatus(containerId, newStatus);

      expect(result.changed).toBe(true);
      expect(mockSocketService.emitStatusChange).toHaveBeenCalledWith(1, expect.objectContaining({
        id_conteneur: 1,
        changed: true
      }));
    });

    it('should not emit if status did not change', async () => {
      const containerId = 1;
      const newStatus = 'ACTIF';

      mockModel.updateStatus.mockResolvedValue({
        id_conteneur: 1,
        uid: 'CNT-123456789',
        statut: 'ACTIF',
        ancien_statut: 'ACTIF',
        changed: false,
        message: 'Le statut est déjà à jour'
      });

      const result = await containerService.updateStatus(containerId, newStatus);

      expect(result.changed).toBe(false);
      expect(mockSocketService.emitStatusChange).not.toHaveBeenCalled();
    });

    it('should not emit if Socket service is not available', async () => {
      const serviceWithoutSocket = new ContainerServices(mockModel, null);

      mockModel.updateStatus.mockResolvedValue({
        id_conteneur: 1,
        uid: 'CNT-123456789',
        statut: 'INACTIF',
        ancien_statut: 'ACTIF',
        changed: true
      });

      const result = await serviceWithoutSocket.updateStatus(1, 'INACTIF');

      expect(result.changed).toBe(true);
      // mockSocketService n'est pas appelé car il n'existe pas
    });

    it('should handle error when emitting', async () => {
      mockModel.updateStatus.mockResolvedValue({
        id_conteneur: 1,
        uid: 'CNT-123456789',
        statut: 'EN_MAINTENANCE',
        ancien_statut: 'ACTIF',
        changed: true
      });

      mockModel.getContainerById.mockResolvedValue({
        id_conteneur: 1,
        uid: 'CNT-123456789',
        id_zone: 1
      });

      mockSocketService.emitStatusChange.mockImplementation(() => {
        throw new Error('Socket emit failed');
      });

      // Ne devrait pas lever d'erreur
      const result = await containerService.updateStatus(1, 'EN_MAINTENANCE');
      expect(result.changed).toBe(true);
    });

    it('should emit to correct zone', async () => {
      const zoneId = 5;

      mockModel.updateStatus.mockResolvedValue({
        id_conteneur: 1,
        uid: 'CNT-123456789',
        statut: 'HORS_SERVICE',
        ancien_statut: 'ACTIF',
        changed: true
      });

      mockModel.getContainerById.mockResolvedValue({
        id_conteneur: 1,
        uid: 'CNT-123456789',
        id_zone: zoneId
      });

      await containerService.updateStatus(1, 'HORS_SERVICE');

      expect(mockSocketService.emitStatusChange).toHaveBeenCalledWith(
        zoneId,
        expect.anything()
      );
    });

    it('should not emit if container has no zone', async () => {
      mockModel.updateStatus.mockResolvedValue({
        id_conteneur: 1,
        uid: 'CNT-123456789',
        statut: 'EN_MAINTENANCE',
        ancien_statut: 'ACTIF',
        changed: true
      });

      mockModel.getContainerById.mockResolvedValue({
        id_conteneur: 1,
        uid: 'CNT-123456789',
        id_zone: null // Pas de zone
      });

      await containerService.updateStatus(1, 'EN_MAINTENANCE');

      expect(mockSocketService.emitStatusChange).not.toHaveBeenCalled();
    });
  });

  describe('Other methods should not emit', () => {
    it('createContainer should not emit', async () => {
      mockModel.createContainer = jest.fn().mockResolvedValue({
        id_conteneur: 1,
        uid: 'CNT-123456789'
      });

      await containerService.createContainer({
        capacite_l: 100,
        statut: 'ACTIF',
        latitude: 48.8,
        longitude: 2.3
      });

      expect(mockSocketService.emitStatusChange).not.toHaveBeenCalled();
    });

    it('updateContainer should not emit', async () => {
      mockModel.updateContainer = jest.fn().mockResolvedValue({
        id_conteneur: 1,
        uid: 'CNT-123456789'
      });

      await containerService.updateContainer(1, { capacite_l: 150 });

      expect(mockSocketService.emitStatusChange).not.toHaveBeenCalled();
    });
  });
});
