jest.mock('../../../src/utils/code-generator', () => ({
  generateUnique: jest.fn(async () => 'ZN123456')
}));

const ZoneRepository = require('../../../src/repositories/zone-repository');
const CodeGenerator = require('../../../src/utils/code-generator');

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

describe('ZoneRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('addZone throws when required fields are missing', async () => {
    const db = createMockDb();
    const model = new ZoneRepository(db);

    await expect(
      model.addZone({ population: 1000, superficie_km2: 10, latitude: 48.8566, longitude: 2.3522 })
    ).rejects.toThrow('Tous les champs requis manquent');
  });

  test('addZone throws for invalid GPS', async () => {
    const db = createMockDb([{ rows: [] }]); // unique code check
    const model = new ZoneRepository(db);

    await expect(
      model.addZone({ code: 'ZONE001', nom: 'Paris', population: 1000, superficie_km2: 10, latitude: 100, longitude: 2.3522 })
    ).rejects.toThrow('Coordonnées GPS invalides');
  });

  test('addZone throws when code exists', async () => {
    const db = createMockDb([{ rows: [{ id_zone: 1 }] }]); // unique code check returns existing
    const model = new ZoneRepository(db);

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
    const model = new ZoneRepository(db);

    const res = await model.addZone({ code: 'ZONE002', nom: 'Lyon', population: 500000, superficie_km2: 47.87, latitude: 45.7640, longitude: 4.8357 });
    expect(res).toEqual(inserted);
  });

  test('addZone auto-generates code and inserts geometry payload', async () => {
    const inserted = {
      id_zone: 11,
      code: 'ZN123456',
      nom: 'Zone Dessinee',
      population: 100,
      superficie_km2: 2,
      couleur: '#ff0000',
      longitude: 2.35,
      latitude: 48.85
    };
    const db = createMockDb([{ rows: [inserted] }]);
    const model = new ZoneRepository(db);

    const res = await model.addZone({
      nom: 'Zone Dessinee',
      population: 100,
      superficie_km2: 2,
      geometry: '{"type":"Polygon","coordinates":[]}',
      couleur: '#ff0000'
    });

    expect(CodeGenerator.generateUnique).toHaveBeenCalledWith(db, 'zone', 'code', 'ZN', 6);
    expect(res).toEqual(inserted);
  });

  test('addZone throws when coordinates are missing without geometry', async () => {
    const db = createMockDb();
    const model = new ZoneRepository(db);

    await expect(
      model.addZone({ nom: 'No GPS', population: 10, superficie_km2: 1 })
    ).rejects.toThrow('Coordonnées GPS requises sans géométrie personnalisée');
  });

  test('addZone throws for negative population/superficie', async () => {
    const db = createMockDb([{ rows: [] }]);
    const model = new ZoneRepository(db);

    await expect(
      model.addZone({
        code: 'ZONE-NEG',
        nom: 'Invalid',
        population: -1,
        superficie_km2: 1,
        latitude: 48,
        longitude: 2
      })
    ).rejects.toThrow('La population et la superficie doivent être positives');
  });

  test('getZoneById throws when not found', async () => {
    const db = createMockDb([{ rows: [] }]);
    const model = new ZoneRepository(db);

    await expect(model.getZoneById(999)).rejects.toThrow("Zone avec l'ID 999 non trouvée");
  });

  test('getZoneById returns a zone', async () => {
    const row = { id_zone: 1, code: 'ZONE001', nom: 'Paris', population: 2161000, superficie_km2: 105.4, longitude: 2.3522, latitude: 48.8566 };
    const db = createMockDb([{ rows: [row] }]);
    const model = new ZoneRepository(db);

    const res = await model.getZoneById(1);
    expect(res).toEqual(row);
  });

  test('getAllZones returns paginated result', async () => {
    const rows = [{ id_zone: 1, nom: 'A' }, { id_zone: 2, nom: 'B' }];
    const db = createMockDb([{ rows }, { rows: [{ count: '12' }] }]);
    const model = new ZoneRepository(db);

    const res = await model.getAllZones(2, 5);
    expect(res.data).toEqual(rows);
    expect(res.pagination).toEqual({
      total: 12,
      page: 2,
      limit: 5,
      pages: 3
    });
  });

  test('getZoneByCode validates and resolves', async () => {
    const row = { id_zone: 1, code: 'ZONE001' };
    const missingDb = createMockDb([{ rows: [] }]);
    const missingModel = new ZoneRepository(missingDb);
    const foundDb = createMockDb([{ rows: [row] }]);
    const foundModel = new ZoneRepository(foundDb);

    await expect(missingModel.getZoneByCode()).rejects.toThrow('Code de zone requis');
    await expect(missingModel.getZoneByCode('UNKNOWN')).rejects.toThrow('Zone avec le code "UNKNOWN" non trouvée');
    await expect(foundModel.getZoneByCode('ZONE001')).resolves.toEqual(row);
  });

  test('updateZone updates fields and returns row', async () => {
    const existing = { id_zone: 1, code: 'ZONE001', nom: 'Paris', population: 2161000, superficie_km2: 105.4 };
    const updated = { ...existing, nom: 'Paris Centre', population: 2200000, longitude: 2.35, latitude: 48.85 };
    const db = createMockDb([
      { rows: [existing] }, // getZoneById
      { rows: [updated] }, // UPDATE RETURNING
    ]);
    const model = new ZoneRepository(db);

    const res = await model.updateZone(1, { nom: 'Paris Centre', population: 2200000 });
    expect(res).toEqual(updated);
  });

  test('updateZone validates id and rejects empty payload', async () => {
    const db = createMockDb();
    const model = new ZoneRepository(db);

    await expect(model.updateZone()).rejects.toThrow('ID de zone requis');

    const dbWithExisting = createMockDb([{ rows: [{ id_zone: 1, superficie_km2: 10 }] }]);
    const modelWithExisting = new ZoneRepository(dbWithExisting);
    await expect(modelWithExisting.updateZone(1, {})).rejects.toThrow('Aucun champ à mettre à jour');
  });

  test('updateZone rejects duplicate code and invalid values', async () => {
    const dbDuplicateCode = createMockDb([
      { rows: [{ id_zone: 1, superficie_km2: 10 }] },
      { rows: [{ id_zone: 2 }] }
    ]);
    const modelDup = new ZoneRepository(dbDuplicateCode);
    await expect(modelDup.updateZone(1, { code: 'ZONE001' })).rejects.toThrow('Le code de zone "ZONE001" existe déjà');

    const dbInvalidPopulation = createMockDb([{ rows: [{ id_zone: 1, superficie_km2: 10 }] }]);
    const modelInvalidPopulation = new ZoneRepository(dbInvalidPopulation);
    await expect(modelInvalidPopulation.updateZone(1, { population: -5 })).rejects.toThrow('La population doit être positive');

    const dbInvalidSuperficie = createMockDb([{ rows: [{ id_zone: 1, superficie_km2: 10 }] }]);
    const modelInvalidSuperficie = new ZoneRepository(dbInvalidSuperficie);
    await expect(modelInvalidSuperficie.updateZone(1, { superficie_km2: -1 })).rejects.toThrow('La superficie doit être positive');

    const dbInvalidGps = createMockDb([{ rows: [{ id_zone: 1, superficie_km2: 10 }] }]);
    const modelInvalidGps = new ZoneRepository(dbInvalidGps);
    await expect(
      modelInvalidGps.updateZone(1, { latitude: 95, longitude: 2 })
    ).rejects.toThrow('Coordonnées GPS invalides');
  });

  test('updateZone updates geometry with GPS or GeoJSON', async () => {
    const updatedGps = { id_zone: 1, nom: 'GPS update' };
    const dbGps = createMockDb([
      { rows: [{ id_zone: 1, superficie_km2: 5 }] },
      { rows: [updatedGps] }
    ]);
    const modelGps = new ZoneRepository(dbGps);
    await expect(
      modelGps.updateZone(1, { latitude: 48.85, longitude: 2.35, superficie_km2: 8 })
    ).resolves.toEqual(updatedGps);

    const updatedGeometry = { id_zone: 1, nom: 'GeoJSON update' };
    const dbGeometry = createMockDb([
      { rows: [{ id_zone: 1, superficie_km2: 5 }] },
      { rows: [updatedGeometry] }
    ]);
    const modelGeometry = new ZoneRepository(dbGeometry);
    await expect(
      modelGeometry.updateZone(1, { geometry: '{"type":"Polygon","coordinates":[]}' })
    ).resolves.toEqual(updatedGeometry);
  });

  test('updateZone can update only area and recompute geometry', async () => {
    const updated = { id_zone: 1, superficie_km2: 12 };
    const db = createMockDb([
      { rows: [{ id_zone: 1, superficie_km2: 10 }] },
      { rows: [updated] }
    ]);
    const model = new ZoneRepository(db);

    await expect(model.updateZone(1, { superficie_km2: 12 })).resolves.toEqual(updated);
  });

  test('deleteZone deletes and returns row', async () => {
    const existing = { id_zone: 1, code: 'ZONE001', nom: 'Paris' };
    const deleted = existing;
    const db = createMockDb([
      { rows: [existing] }, // getZoneById
      { rows: [deleted] }, // DELETE RETURNING
    ]);
    const model = new ZoneRepository(db);

    const res = await model.deleteZone(1);
    expect(res).toEqual(deleted);
  });

  test('deleteZone validates id', async () => {
    const db = createMockDb();
    const model = new ZoneRepository(db);

    await expect(model.deleteZone()).rejects.toThrow('ID de zone requis');
  });

  test('deleteAllZones returns all removed rows', async () => {
    const rows = [{ id_zone: 1 }, { id_zone: 2 }];
    const db = createMockDb([{ rows }]);
    const model = new ZoneRepository(db);

    await expect(model.deleteAllZones()).resolves.toEqual(rows);
  });

  test('searchZonesByName throws when name missing', async () => {
    const db = createMockDb();
    const model = new ZoneRepository(db);

    await expect(model.searchZonesByName('')).rejects.toThrow('Le nom de zone requis pour la recherche');
  });

  test('getZonesInRadius throws for invalid params', async () => {
    const db = createMockDb();
    const model = new ZoneRepository(db);

    await expect(model.getZonesInRadius(null, 2.35, 10)).rejects.toThrow('Latitude, longitude et rayon requis');
    await expect(model.getZonesInRadius(95, 2.35, 10)).rejects.toThrow('Coordonnées GPS invalides');
    await expect(model.getZonesInRadius(48.85, 2.35, 0)).rejects.toThrow('Le rayon doit être positif');
  });

  test('getZonesInRadius returns ordered rows', async () => {
    const rows = [{ id_zone: 1, distance_km: 1.2 }, { id_zone: 2, distance_km: 2.4 }];
    const db = createMockDb([{ rows }]);
    const model = new ZoneRepository(db);

    await expect(model.getZonesInRadius(48.85, 2.35, 5)).resolves.toEqual(rows);
  });

  test('getZoneStatistics, countZones, zoneExists and codeExists', async () => {
    const stats = { total_zones: '2' };
    const db = createMockDb([
      { rows: [stats] },
      { rows: [{ count: '7' }] },
      { rows: [{ id_zone: 1 }] },
      { rows: [] },
      { rows: [{ id_zone: 9 }] },
      { rows: [] }
    ]);
    const model = new ZoneRepository(db);

    await expect(model.getZoneStatistics()).resolves.toEqual(stats);
    await expect(model.countZones()).resolves.toBe(7);
    await expect(model.zoneExists(1)).resolves.toBe(true);
    await expect(model.zoneExists(999)).resolves.toBe(false);
    await expect(model.codeExists('ZONE9')).resolves.toBe(true);
    await expect(model.codeExists('NONE')).resolves.toBe(false);
  });
});
