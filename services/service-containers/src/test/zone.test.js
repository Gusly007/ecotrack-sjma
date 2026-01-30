const ZoneModel = require('../models/zone-model');

function createMockDb(returnSequence = []) {
  let callIndex = 0;
  return {
    query: jest.fn(async () => {
      const res = returnSequence[callIndex] || { rows: [] };
      callIndex += 1;
      return res;
    }),
  };
}

describe('ZoneModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('addZone throws when required fields are missing', async () => {
    const db = createMockDb();
    const model = new ZoneModel(db);

    await expect(
      model.addZone({ nom: 'Paris', population: 1000, superficie_km2: 10, latitude: 48.8566, longitude: 2.3522 })
    ).rejects.toThrow('Tous les champs requis manquent');
  });

  test('addZone throws for invalid GPS', async () => {
    const db = createMockDb([{ rows: [] }]); // unique code check
    const model = new ZoneModel(db);

    await expect(
      model.addZone({ code: 'ZONE001', nom: 'Paris', population: 1000, superficie_km2: 10, latitude: 100, longitude: 2.3522 })
    ).rejects.toThrow('Coordonnées GPS invalides');
  });

  test('addZone throws when code exists', async () => {
    const db = createMockDb([{ rows: [{ id_zone: 1 }] }]); // unique code check returns existing
    const model = new ZoneModel(db);

    await expect(
      model.addZone({ code: 'ZONE001', nom: 'Paris', population: 1000, superficie_km2: 10, latitude: 48.8566, longitude: 2.3522 })
    ).rejects.toThrow('Le code de zone "ZONE001" existe déjà');
  });

  test('addZone succeeds and returns inserted row', async () => {
    const inserted = {
      id_zone: 10,
      code: 'ZONE002',
      nom: 'Lyon',
      population: 500000,
      superficie_km2: 47.87,
      longitude: 4.8357,
      latitude: 45.7640,
    };
    const db = createMockDb([
      { rows: [] }, // unique code check
      { rows: [inserted] }, // insert returning
    ]);
    const model = new ZoneModel(db);

    const res = await model.addZone({ code: 'ZONE002', nom: 'Lyon', population: 500000, superficie_km2: 47.87, latitude: 45.7640, longitude: 4.8357 });
    expect(res).toEqual(inserted);
  });

  test('getZoneById throws when not found', async () => {
    const db = createMockDb([{ rows: [] }]);
    const model = new ZoneModel(db);

    await expect(model.getZoneById(999)).rejects.toThrow("Zone avec l'ID 999 non trouvée");
  });

  test('getZoneById returns a zone', async () => {
    const row = { id_zone: 1, code: 'ZONE001', nom: 'Paris', population: 2161000, superficie_km2: 105.4, longitude: 2.3522, latitude: 48.8566 };
    const db = createMockDb([{ rows: [row] }]);
    const model = new ZoneModel(db);

    const res = await model.getZoneById(1);
    expect(res).toEqual(row);
  });

  test('updateZone updates fields and returns row', async () => {
    const existing = { id_zone: 1, code: 'ZONE001', nom: 'Paris', population: 2161000, superficie_km2: 105.4 };
    const updated = { ...existing, nom: 'Paris Centre', population: 2200000, longitude: 2.35, latitude: 48.85 };
    const db = createMockDb([
      { rows: [existing] }, // getZoneById
      { rows: [updated] }, // UPDATE RETURNING
    ]);
    const model = new ZoneModel(db);

    const res = await model.updateZone(1, { nom: 'Paris Centre', population: 2200000 });
    expect(res).toEqual(updated);
  });

  test('deleteZone deletes and returns row', async () => {
    const existing = { id_zone: 1, code: 'ZONE001', nom: 'Paris' };
    const deleted = existing;
    const db = createMockDb([
      { rows: [existing] }, // getZoneById
      { rows: [deleted] }, // DELETE RETURNING
    ]);
    const model = new ZoneModel(db);

    const res = await model.deleteZone(1);
    expect(res).toEqual(deleted);
  });

  test('searchZonesByName throws when name missing', async () => {
    const db = createMockDb();
    const model = new ZoneModel(db);

    await expect(model.searchZonesByName('')).rejects.toThrow('Le nom de zone requis pour la recherche');
  });

  test('getZonesInRadius throws for invalid params', async () => {
    const db = createMockDb();
    const model = new ZoneModel(db);

    await expect(model.getZonesInRadius(null, 2.35, 10)).rejects.toThrow('Latitude, longitude et rayon requis');
    await expect(model.getZonesInRadius(95, 2.35, 10)).rejects.toThrow('Coordonnées GPS invalides');
    await expect(model.getZonesInRadius(48.85, 2.35, 0)).rejects.toThrow('Le rayon doit être positif');
  });
});
