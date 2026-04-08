/**
 * Générateur de codes uniques
 */
class CodeGenerator {
  static generate(prefix = 'ZN', length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = prefix;
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  static async generateUnique(db, table, column, prefix = 'ZN', length = 6, maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
      const code = CodeGenerator.generate(prefix, length);
      const result = await db.query(
        `SELECT 1 FROM ${table} WHERE ${column} = $1`,
        [code]
      );
      if (result.rows.length === 0) {
        return code;
      }
    }
    throw new Error(`Impossible de générer un code unique après ${maxAttempts} tentatives`);
  }
}

module.exports = CodeGenerator;
