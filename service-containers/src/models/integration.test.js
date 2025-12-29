// We recommend installing an extension to run jest tests.
const crudcontainer = require('./crudcontainermodel');
const pool = require('../db/connexion').pool; // Import the actual pool
const query = require('../db/connexion').query;

describe('Integration tests for crudcontainer model', () => {
  let model;
  const createdIds = [];

  beforeAll(() => {
    model = new crudcontainer(pool);
  });

  afterAll(async () => {
    // cleanup any leftover containers created during tests
    //only if you want to delete all containers
    //await model.deleteallcontainers();
    for (const id of createdIds) {
      try {
        await query('DELETE FROM conteneur WHERE id_conteneur = $1', [id]);
      } catch (e) {
        // ignore cleanup errors
      }
    }
  });

  describe('createcontainer', () => {
    it('should insert a new container and return it', async () => {
      const result = await model.createcontainer(200, 'POINT(2.3522 48.8566)');
      expect(result).toHaveProperty('id_conteneur');
      expect(result.capacite_l).toBe(200);
      createdIds.push(result.id_conteneur);
      // position assertions are DB-specific (PostGIS) and may require WKT conversion
    });

    it('should create multiple containers with unique ids', async () => {
      const a = await model.createcontainer(100, 'POINT(1 1)');
      const b = await model.createcontainer(200, 'POINT(2 2)');
      const c = await model.createcontainer(300, 'POINT(3 3)');
      expect(a.id_conteneur).not.toBe(b.id_conteneur);
      expect(b.id_conteneur).not.toBe(c.id_conteneur);
      createdIds.push(a.id_conteneur, b.id_conteneur, c.id_conteneur);
    });

    it('should reject invalid position format', async () => {
      await expect(model.createcontainer(100, 'INVALID_WKT')).rejects.toThrow();
    });
  });

  describe('updatecontainer', () => {
    it('should update the container and return it', async () => {
      const created = await model.createcontainer(300, 'POINT(2.3522 48.8566)');
      createdIds.push(created.id_conteneur);
      const result = await model.updatecontainer(created.id_conteneur, 'POINT(2.3822 48.8566)');
      expect(result.id_conteneur).toBe(created.id_conteneur);
    });

    it('should return undefined when updating a non-existent container', async () => {
      const result = await model.updatecontainer(99999999, 'POINT(0 0)');
      expect(result).toBeUndefined();
    });
  });

  describe('getcontainerById', () => {
    it('should return the container with the given id', async () => {
      const created = await model.createcontainer(400, 'POINT(2.3522 48.8566)');
      createdIds.push(created.id_conteneur);
      const result = await model.getcontainerById(created.id_conteneur);
      expect(result.id_conteneur).toBe(created.id_conteneur);
      expect(result.capacite_l).toBe(400);
    });

    it('should return undefined for a non-existent id', async () => {
      const result = await model.getcontainerById(99999999);
      expect(result).toBeUndefined();
    });
  });

  describe('deletecontainer', () => {
    it('should delete the container and return it', async () => {
      const created = await model.createcontainer(500, 'POINT(2.3522 48.8566)');
      const result = await model.deletecontainer(created.id_conteneur);
      expect(result.id_conteneur).toBe(created.id_conteneur);
      // Verify it's actually deleted
      const fetch = await model.getcontainerById(created.id_conteneur);
      expect(fetch).toBeUndefined();
    });

    it('should return undefined when deleting a non-existent container', async () => {
      const result = await model.deletecontainer(99999999);
      expect(result).toBeUndefined();
    });
  });

  describe('validation and edge cases', () => {
    // a revoir selon contraintes BD
    it('should allow capacity = 0 if DB permits', async () => {
      const created = await model.createcontainer(0, 'POINT(0 0)');
      // Accept either successful creation or rejection depending on DB constraints
      if (created && created.id_conteneur) {
        createdIds.push(created.id_conteneur);
        expect(created.capacite_l).toBe(0);
      } else {
        expect(created).toBeUndefined();
      }
    });

    it('multiple create/get consistency', async () => {
      const created = await model.createcontainer(123, 'POINT(5 5)');
      createdIds.push(created.id_conteneur);
      const fetched = await model.getcontainerById(created.id_conteneur);
      expect(fetched.id_conteneur).toBe(created.id_conteneur);
      expect(fetched.capacite_l).toBe(123);
    });
  });
});