const TypeConteneurRepository = require('../../../src/repositories/type-conteneur-repository');

function makeDb(sequence = []) {
  let index = 0;
  return {
    query: jest.fn(async () => {
      const item = sequence[index] || { rows: [], rowCount: 0 };
      index += 1;
      return item;
    })
  };
}

describe('TypeConteneurRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createTypeConteneur validates required fields and nom', async () => {
    const repo = new TypeConteneurRepository(makeDb());

    await expect(repo.createTypeConteneur({ code: 'ORD' })).rejects.toThrow('Champs requis manquants: code, nom');
    await expect(repo.createTypeConteneur({ code: 'ORD', nom: 'INVALID' })).rejects.toThrow('Nom invalide');
  });

  test('createTypeConteneur rejects duplicate code', async () => {
    const repo = new TypeConteneurRepository(makeDb([{ rows: [{ id_type: 2 }] }]));

    await expect(repo.createTypeConteneur({ code: 'ORD', nom: 'ORDURE' })).rejects.toThrow('Le code "ORD" existe déjà');
  });

  test('createTypeConteneur inserts and returns created row', async () => {
    const row = { id_type: 1, code: 'REC', nom: 'RECYCLAGE' };
    const repo = new TypeConteneurRepository(
      makeDb([{ rows: [] }, { rows: [row] }])
    );

    const result = await repo.createTypeConteneur({ code: 'REC', nom: 'RECYCLAGE' });

    expect(result).toEqual(row);
  });

  test('getAllTypes returns rows', async () => {
    const rows = [{ id_type: 1, code: 'VER', nom: 'VERRE' }];
    const repo = new TypeConteneurRepository(makeDb([{ rows }]));

    await expect(repo.getAllTypes()).resolves.toEqual(rows);
  });

  test('getTypeById validates id and not found', async () => {
    const repo = new TypeConteneurRepository(makeDb([{ rows: [] }]));

    await expect(repo.getTypeById()).rejects.toThrow('Le paramètre id est requis');
    await expect(repo.getTypeById(42)).rejects.toThrow("Type de conteneur avec l'ID 42 introuvable");
  });

  test('getTypeByCode validates code and not found', async () => {
    const repo = new TypeConteneurRepository(makeDb([{ rows: [] }]));

    await expect(repo.getTypeByCode()).rejects.toThrow('Le paramètre code est requis');
    await expect(repo.getTypeByCode('UNK')).rejects.toThrow('Type de conteneur avec le code "UNK" introuvable');
  });

  test('getTypeByNom validates and returns rows', async () => {
    const rows = [{ id_type: 3, code: 'COM', nom: 'COMPOST' }];
    const repo = new TypeConteneurRepository(makeDb([{ rows }]));

    await expect(repo.getTypeByNom()).rejects.toThrow('Le paramètre nom est requis');
    await expect(repo.getTypeByNom('COMPOST')).resolves.toEqual(rows);
  });

  test('updateTypeConteneur validates id, payload and nom', async () => {
    const repo = new TypeConteneurRepository(makeDb());

    await expect(repo.updateTypeConteneur()).rejects.toThrow('Le paramètre id est requis');
    await expect(repo.updateTypeConteneur(1, {})).rejects.toThrow('Aucun champ à mettre à jour');
    await expect(repo.updateTypeConteneur(1, { nom: 'BAD' })).rejects.toThrow('Nom invalide');
  });

  test('updateTypeConteneur rejects duplicate code', async () => {
    const repo = new TypeConteneurRepository(makeDb([{ rows: [{ id_type: 99 }] }]));

    await expect(repo.updateTypeConteneur(2, { code: 'ORD' })).rejects.toThrow('Le code "ORD" existe déjà');
  });

  test('updateTypeConteneur updates code and nom', async () => {
    const updated = { id_type: 2, code: 'NOU', nom: 'ORDURE' };
    const repo = new TypeConteneurRepository(
      makeDb([{ rows: [] }, { rows: [updated] }])
    );

    const result = await repo.updateTypeConteneur(2, { code: 'NOU', nom: 'ORDURE' });

    expect(result).toEqual(updated);
  });

  test('updateTypeConteneur throws when target does not exist', async () => {
    const repo = new TypeConteneurRepository(makeDb([{ rows: [] }, { rows: [] }]));

    await expect(repo.updateTypeConteneur(77, { code: 'NEW' })).rejects.toThrow("Type de conteneur avec l'ID 77 introuvable");
  });

  test('deleteTypeConteneur validates id and not found', async () => {
    const repo = new TypeConteneurRepository(makeDb([{ rows: [] }]));

    await expect(repo.deleteTypeConteneur()).rejects.toThrow('Le paramètre id est requis');
    await expect(repo.deleteTypeConteneur(9)).rejects.toThrow("Type de conteneur avec l'ID 9 introuvable");
  });

  test('deleteTypeConteneur returns deleted row', async () => {
    const deleted = { id_type: 1, code: 'ORD', nom: 'ORDURE' };
    const repo = new TypeConteneurRepository(makeDb([{ rows: [deleted] }]));

    await expect(repo.deleteTypeConteneur(1)).resolves.toEqual(deleted);
  });

  test('deleteAllTypes returns all deleted rows', async () => {
    const rows = [{ id_type: 1 }, { id_type: 2 }];
    const repo = new TypeConteneurRepository(makeDb([{ rows }]));

    await expect(repo.deleteAllTypes()).resolves.toEqual(rows);
  });

  test('countTypes parses integer total', async () => {
    const repo = new TypeConteneurRepository(makeDb([{ rows: [{ total: '5' }] }]));

    await expect(repo.countTypes()).resolves.toBe(5);
  });

  test('typeExists validates id then returns booleans', async () => {
    const repoTrue = new TypeConteneurRepository(makeDb([{ rows: [], rowCount: 1 }]));
    const repoFalse = new TypeConteneurRepository(makeDb([{ rows: [], rowCount: 0 }]));

    await expect(repoTrue.typeExists()).rejects.toThrow('Le paramètre id est requis');
    await expect(repoTrue.typeExists(1)).resolves.toBe(true);
    await expect(repoFalse.typeExists(2)).resolves.toBe(false);
  });

  test('codeExists validates code then returns booleans', async () => {
    const repoTrue = new TypeConteneurRepository(makeDb([{ rows: [], rowCount: 1 }]));
    const repoFalse = new TypeConteneurRepository(makeDb([{ rows: [], rowCount: 0 }]));

    await expect(repoTrue.codeExists()).rejects.toThrow('Le paramètre code est requis');
    await expect(repoTrue.codeExists('ORD')).resolves.toBe(true);
    await expect(repoFalse.codeExists('ZZZ')).resolves.toBe(false);
  });

  test('countContainersByType validates idType and parses total', async () => {
    const repo = new TypeConteneurRepository(makeDb([{ rows: [{ total: '8' }] }]));

    await expect(repo.countContainersByType()).rejects.toThrow('Le paramètre idType est requis');
    await expect(repo.countContainersByType(1)).resolves.toBe(8);
  });

  test('getTypeWithStats composes type data and count', async () => {
    const repo = new TypeConteneurRepository(makeDb([
      { rows: [{ id_type: 4, code: 'COM', nom: 'COMPOST' }] },
      { rows: [{ total: '3' }] }
    ]));

    await expect(repo.getTypeWithStats()).rejects.toThrow('Le paramètre id est requis');

    const result = await repo.getTypeWithStats(4);
    expect(result).toEqual({
      id_type: 4,
      code: 'COM',
      nom: 'COMPOST',
      nombre_conteneurs: 3
    });
  });

  test('getAllTypesWithStats returns rows', async () => {
    const rows = [{ id_type: 1, code: 'ORD', nom: 'ORDURE', nombre_conteneurs: '2' }];
    const repo = new TypeConteneurRepository(makeDb([{ rows }]));

    await expect(repo.getAllTypesWithStats()).resolves.toEqual(rows);
  });
});
