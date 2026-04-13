const CodeGenerator = require('../../../src/utils/code-generator');

describe('CodeGenerator', () => {
  it('generate returns code with prefix and expected length', () => {
    const code = CodeGenerator.generate('ZN', 6);
    expect(code.startsWith('ZN')).toBe(true);
    expect(code).toHaveLength(8);
  });

  it('generateUnique returns first available code', async () => {
    const db = {
      query: jest.fn().mockResolvedValue({ rows: [] })
    };

    const code = await CodeGenerator.generateUnique(db, 'zones', 'code', 'ZN', 4, 3);

    expect(code.startsWith('ZN')).toBe(true);
    expect(db.query).toHaveBeenCalled();
  });

  it('generateUnique retries and throws after max attempts', async () => {
    const db = {
      query: jest.fn().mockResolvedValue({ rows: [{ ok: 1 }] })
    };

    await expect(CodeGenerator.generateUnique(db, 'zones', 'code', 'ZN', 4, 2))
      .rejects.toThrow('Impossible de générer un code unique');
    expect(db.query).toHaveBeenCalledTimes(2);
  });
});
