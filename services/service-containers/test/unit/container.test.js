const ConteneurModel = require('../../src/models/container-model');
const db = {}; // Mock database object for testing

describe('ConteneurModel', () => {
  let model;
  beforeAll(() => {
    model = new ConteneurModel(db);
  });

  describe('createContainer', () => {
    it('should throw an error if required fields are missing', async () => {
      await expect(model.createContainer({ capacite_l: null, statut: 'active', latitude: 48.8, longitude: 2.3 }))
        .rejects.toThrow('Champs requis manquants: capacite_l, statut, latitude, longitude');
      
      await expect(model.createContainer({ capacite_l: 100, statut: null, latitude: 48.8, longitude: 2.3 }))
        .rejects.toThrow('Champs requis manquants: capacite_l, statut, latitude, longitude');
      
      await expect(model.createContainer({ capacite_l: 100, statut: 'active', latitude: null, longitude: 2.3 }))
        .rejects.toThrow('Champs requis manquants: capacite_l, statut, latitude, longitude');
    });

    it('should throw an error for invalid GPS coordinates', async () => {
      await expect(model.createContainer({ capacite_l: 100, statut: 'active', latitude: 91, longitude: 2.3 }))
        .rejects.toThrow('Coordonnées GPS invalides');
      
      await expect(model.createContainer({ capacite_l: 100, statut: 'active', latitude: 48.8, longitude: 181 }))
        .rejects.toThrow('Coordonnées GPS invalides');
    });

    it('should insert a new container and return it', async () => {
      db.query = jest.fn().mockResolvedValue({ 
        rows: [{ 
          id_conteneur: 1, 
          uid: 'CNT-123456789', 
          capacite_l: 100, 
          statut: 'active', 
          date_installation: '2025-01-06',
          latitude: 48.8566,
          longitude: 2.3522,
          id_zone: null,
          id_type: null
        }] 
      });

      const result = await model.createContainer({ 
        capacite_l: 100, 
        statut: 'active', 
        latitude: 48.8566, 
        longitude: 2.3522 
      });

      expect(result).toHaveProperty('id_conteneur');
      expect(result.capacite_l).toBe(100);
      expect(result.statut).toBe('active');
    });
  });
  describe('updateContainer', () => {
    it('should throw an error if id is missing', async () => {
      await expect(model.updateContainer(null, { capacite_l: 100 }))
        .rejects.toThrow('Champ requis manquant: id');
    });

    it('should throw an error if no fields to update', async () => {
      db.query = jest.fn();
      await expect(model.updateContainer(1, {}))
        .rejects.toThrow('Aucun champ à mettre à jour');
    });

    it('should throw an error if trying to update statut', async () => {
      await expect(model.updateContainer(1, { statut: 'inactive' }))
        .rejects.toThrow('Le statut doit être modifié via la méthode updateStatus dédiée');
    });

    it('should throw an error for invalid GPS coordinates', async () => {
      await expect(model.updateContainer(1, { latitude: 91, longitude: 2.3 }))
        .rejects.toThrow();
    });
  
    it('should update the container and return it', async () => {
      db.query = jest.fn().mockResolvedValue({ 
        rows: [{ 
          id_conteneur: 1, 
          uid: 'CNT-123456789',
          capacite_l: 150, 
          statut: 'ACTIF',
          date_installation: '2025-01-06',
          latitude: 48.8566,
          longitude: 2.3522,
          id_zone: 1,
          id_type: 1
        }] 
      });
  
      const result = await model.updateContainer(1, { capacite_l: 150, id_zone: 1, id_type: 1 });
      expect(result).toHaveProperty('id_conteneur');
      expect(result.capacite_l).toBe(150);
    });
    });
  
    describe('getContainerById', () => {
      it('should return the container with the given id', async () => {
        db.query = jest.fn().mockResolvedValue({ 
          rows: [{ 
            id_conteneur: 1, 
            uid: 'CNT-123456789',
            capacite_l: 100, 
            statut: 'ACTIF',
            latitude: 48.8566,
            longitude: 2.3522
          }] 
        });
  
        const result = await model.getContainerById(1);
        expect(result).toHaveProperty('id_conteneur');
        expect(result.id_conteneur).toBe(1);
      });

      it('should return undefined for non-existent container', async () => {
        db.query = jest.fn().mockResolvedValue({ rows: [] });
        
        const result = await model.getContainerById(999);
        expect(result).toBeUndefined();
      });

      it('should throw an error if id is missing', async () => {
        await expect(model.getContainerById(null))
          .rejects.toThrow();
      });
    });
  
    describe('deleteContainer', () => {
      it('should throw an error if id is missing', async () => {
        await expect(model.deleteContainer(null))
          .rejects.toThrow('Champ requis manquant: id');
      });
  
      it('should delete the container and return it', async () => {
        db.query = jest.fn().mockResolvedValue({ 
          rows: [{ 
            id_conteneur: 1, 
            capacite_l: 100, 
            statut: 'active',
            latitude: 48.8566,
            longitude: 2.3522
          }] 
        });
  
        const result = await model.deleteContainer(1);
        expect(result).toHaveProperty('id_conteneur');
        expect(result.id_conteneur).toBe(1);
      });
  
      it('should return undefined for non-existent container', async () => {
        db.query = jest.fn().mockResolvedValue({ rows: [] });
        
        const result = await model.deleteContainer(999);
        expect(result).toBeUndefined();
      });
    });

    describe('updateStatus', () => {
      it('should throw an error if id or statut is missing', async () => {
        await expect(model.updateStatus(null, 'ACTIF'))
          .rejects.toThrow('Le paramètre id est requis');
        
        await expect(model.updateStatus(1, null))
          .rejects.toThrow('Le paramètre statut est requis');
      });

      it('should throw an error for invalid statut', async () => {
        // Mock connect pour retourner un client avec query
        const mockClient = {
          query: jest.fn(),
          release: jest.fn()
        };
        db.connect = jest.fn().mockResolvedValue(mockClient);
        
        await expect(model.updateStatus(1, 'INVALID_STATUS'))
          .rejects.toThrow('Statut invalide');
      });

      it('should update container status successfully', async () => {
        const mockClient = {
          query: jest.fn()
            .mockResolvedValueOnce({}) // BEGIN
            .mockResolvedValueOnce({ rows: [{ id_conteneur: 1, uid: 'CNT-123456789', statut: 'ACTIF' }] }) // SELECT current status
            .mockResolvedValueOnce({ rows: [{ id_conteneur: 1, uid: 'CNT-123456789', statut: 'EN_MAINTENANCE' }] }) // UPDATE
            .mockResolvedValueOnce({}) // INSERT historique
            .mockResolvedValueOnce({}), // COMMIT
          release: jest.fn()
        };
        db.connect = jest.fn().mockResolvedValue(mockClient);

        const result = await model.updateStatus(1, 'EN_MAINTENANCE');
        expect(result).toHaveProperty('id_conteneur');
        expect(result.statut).toBe('EN_MAINTENANCE');
        expect(result.ancien_statut).toBe('ACTIF');
        expect(result.changed).toBe(true);
        expect(mockClient.release).toHaveBeenCalled();
      });

      it('should return unchanged when status is already the same', async () => {
        const mockClient = {
          query: jest.fn()
            .mockResolvedValueOnce({}) // BEGIN
            .mockResolvedValueOnce({ rows: [{ id_conteneur: 1, uid: 'CNT-123456789', statut: 'ACTIF' }] }) // SELECT current status
            .mockResolvedValueOnce({}), // COMMIT
          release: jest.fn()
        };
        db.connect = jest.fn().mockResolvedValue(mockClient);

        const result = await model.updateStatus(1, 'ACTIF');
        expect(result.statut).toBe('ACTIF');
        expect(result.changed).toBe(false);
        expect(result.message).toBe('Le statut est déjà à jour');
      });

      it('should throw error when container not found', async () => {
        const mockClient = {
          query: jest.fn()
            .mockResolvedValueOnce({}) // BEGIN
            .mockResolvedValueOnce({ rows: [] }), // SELECT returns no rows
          release: jest.fn()
        };
        db.connect = jest.fn().mockResolvedValue(mockClient);

        await expect(model.updateStatus(999, 'ACTIF'))
          .rejects.toThrow("Conteneur avec l'ID 999 introuvable");
        expect(mockClient.release).toHaveBeenCalled();
      });
    });

    describe('deleteAllContainers', () => {
      it('should delete all containers and return them', async () => {
        const mockContainers = [
          { id_conteneur: 1, capacite_l: 100 },
          { id_conteneur: 2, capacite_l: 200 }
        ];
        db.query = jest.fn().mockResolvedValue({ rows: mockContainers });

        const result = await model.deleteAllContainers();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(2);
      });
    });

    describe('countContainers', () => {
      it('should count containers without filters', async () => {
        db.query = jest.fn().mockResolvedValue({ rows: [{ count: '10' }] });

        const result = await model.countContainers();
        expect(typeof result).toBe('number');
        expect(result).toBe(10);
      });

      it('should count containers with status filter', async () => {
        db.query = jest.fn().mockResolvedValue({ rows: [{ count: '5' }] });

        const result = await model.countContainers({ statut: 'ACTIF' });
        expect(result).toBe(5);
      });
    });

    describe('existContainer', () => {
      it('should return true if container exists', async () => {
        db.query = jest.fn().mockResolvedValue({ rowCount: 1, rows: [{ '1': 1 }] });

        const result = await model.existContainer(1);
        expect(result).toBe(true);
      });

      it('should return false if container does not exist', async () => {
        db.query = jest.fn().mockResolvedValue({ rowCount: 0, rows: [] });

        const result = await model.existContainer(999);
        expect(result).toBe(false);
      });

      it('should throw an error if id is missing', async () => {
        await expect(model.existContainer(null))
          .rejects.toThrow('Champ requis manquant: id');
      });
    });

    describe('existByUid', () => {
      it('should return true if container with uid exists', async () => {
        db.query = jest.fn().mockResolvedValue({ rowCount: 1, rows: [{ '1': 1 }] });

        const result = await model.existByUid('CNT-123456789');
        expect(result).toBe(true);
      });

      it('should return false if container with uid does not exist', async () => {
        db.query = jest.fn().mockResolvedValue({ rowCount: 0, rows: [] });

        const result = await model.existByUid('INVALID-UID');
        expect(result).toBe(false);
      });

      it('should throw an error if uid is missing', async () => {
        await expect(model.existByUid(null))
          .rejects.toThrow('Champ requis manquant: uid');
      });
    });

    describe('getContainerByUid', () => {
      it('should return container by uid', async () => {
        db.query = jest.fn().mockResolvedValue({
          rows: [{ id_conteneur: 1, uid: 'CNT-123456789', capacite_l: 100 }]
        });

        const result = await model.getContainerByUid('CNT-123456789');
        expect(result).toHaveProperty('id_conteneur');
        expect(result.uid).toBe('CNT-123456789');
      });

      it('should return undefined if container with uid not found', async () => {
        db.query = jest.fn().mockResolvedValue({ rows: [] });

        const result = await model.getContainerByUid('INVALID-UID');
        expect(result).toBeUndefined();
      });

      it('should throw an error if uid is missing', async () => {
        await expect(model.getContainerByUid(null))
          .rejects.toThrow();
      });
    });

    describe('getAllContainers', () => {
      it('should return all containers', async () => {
        const mockContainers = [
          { id_conteneur: 1, capacite_l: 100 },
          { id_conteneur: 2, capacite_l: 200 }
        ];
        db.query = jest.fn().mockResolvedValue({ rows: mockContainers });

        const result = await model.getAllContainers();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(2);
      });

      it('should return containers with limit and offset', async () => {
        const mockContainers = [{ id_conteneur: 1, capacite_l: 100 }];
        db.query = jest.fn().mockResolvedValue({ rows: mockContainers });

        const result = await model.getAllContainers({ limit: 10, offset: 0 });
        expect(result.length).toBe(1);
      });
    });

    describe('getContainersByStatus', () => {
      it('should return containers with given status', async () => {
        const mockContainers = [{ id_conteneur: 1, statut: 'ACTIF' }];
        db.query = jest.fn().mockResolvedValue({ rows: mockContainers });

        const result = await model.getContainersByStatus('ACTIF');
        expect(Array.isArray(result)).toBe(true);
        expect(result[0].statut).toBe('ACTIF');
      });

      it('should throw an error if status is missing', async () => {
        await expect(model.getContainersByStatus(null))
          .rejects.toThrow();
      });
    });

    describe('getContainersByZone', () => {
      it('should return containers in a zone', async () => {
        const mockContainers = [{ id_conteneur: 1, id_zone: 1 }];
        db.query = jest.fn().mockResolvedValue({ rows: mockContainers });

        const result = await model.getContainersByZone(1);
        expect(Array.isArray(result)).toBe(true);
        expect(result[0].id_zone).toBe(1);
      });

      it('should throw an error if id_zone is missing', async () => {
        await expect(model.getContainersByZone(null))
          .rejects.toThrow();
      });
    });

    describe('getContainersInRadius', () => {
      it('should return containers within radius', async () => {
        const mockContainers = [{ id_conteneur: 1, latitude: 48.8566, longitude: 2.3522 }];
        db.query = jest.fn().mockResolvedValue({ rows: mockContainers });

        const result = await model.getContainersInRadius(48.8566, 2.3522, 5);
        expect(Array.isArray(result)).toBe(true);
      });

      it('should throw an error if required parameters are missing', async () => {
        await expect(model.getContainersInRadius(null, 2.3522, 5))
          .rejects.toThrow();
      });
    });

    describe('getStatistics', () => {
      it('should return container statistics', async () => {
        const stats = {
          total: 10,
          actif: 8,
          inactif: 1,
          en_maintenance: 1,
          capacite_moyenne: 150
        };
        db.query = jest.fn().mockResolvedValue({ rows: [stats] });

        const result = await model.getStatistics();
        expect(result).toHaveProperty('total');
        expect(result.total).toBe(10);
    });
  });
});
