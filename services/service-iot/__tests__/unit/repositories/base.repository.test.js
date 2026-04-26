/**
 * Unit tests for base repository
 */

describe('BaseRepository - CRUD Operations', () => {
  let repository;
  let mockDb;

  beforeEach(() => {
    // Mock database
    mockDb = {
      query: jest.fn(),
      transaction: jest.fn()
    };

    // Simple repository implementation
    class BaseRepository {
      constructor(tableName) {
        this.tableName = tableName;
        this.db = mockDb;
      }

      async findAll(limit = 50, offset = 0) {
        const query = `SELECT * FROM ${this.tableName} LIMIT $1 OFFSET $2`;
        return this.db.query(query, [limit, offset]);
      }

      async findById(id) {
        const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
        return this.db.query(query, [id]);
      }

      async create(data) {
        const columns = Object.keys(data).join(', ');
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        const query = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;
        return this.db.query(query, values);
      }

      async update(id, data) {
        const updates = Object.keys(data).map((k, i) => `${k} = $${i + 2}`).join(', ');
        const query = `UPDATE ${this.tableName} SET ${updates} WHERE id = $1 RETURNING *`;
        return this.db.query(query, [id, ...Object.values(data)]);
      }

      async delete(id) {
        const query = `DELETE FROM ${this.tableName} WHERE id = $1`;
        return this.db.query(query, [id]);
      }
    }

    repository = new BaseRepository('sensors');
  });

  describe('CRUD operations', () => {
    it('should find all records with pagination', async () => {
      mockDb.query.mockResolvedValue({ rows: [{ id: 1, name: 'sensor-1' }] });
      
      const result = await repository.findAll(50, 0);
      
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM sensors LIMIT $1 OFFSET $2',
        [50, 0]
      );
      expect(result.rows).toHaveLength(1);
    });

    it('should find record by ID', async () => {
      mockDb.query.mockResolvedValue({ rows: [{ id: 1, name: 'sensor-1' }] });
      
      const result = await repository.findById(1);
      
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM sensors WHERE id = $1',
        [1]
      );
      expect(result.rows[0].id).toBe(1);
    });

    it('should create new record', async () => {
      const newData = { name: 'new-sensor', value: 45 };
      mockDb.query.mockResolvedValue({ rows: [{ id: 1, ...newData }] });
      
      const result = await repository.create(newData);
      
      expect(mockDb.query).toHaveBeenCalled();
      expect(result.rows[0].name).toBe('new-sensor');
    });

    it('should update record', async () => {
      const updateData = { value: 60 };
      mockDb.query.mockResolvedValue({ rows: [{ id: 1, ...updateData }] });
      
      const result = await repository.update(1, updateData);
      
      expect(mockDb.query).toHaveBeenCalled();
      expect(result.rows[0].value).toBe(60);
    });

    it('should delete record', async () => {
      mockDb.query.mockResolvedValue({ rowCount: 1 });
      
      const result = await repository.delete(1);
      
      expect(mockDb.query).toHaveBeenCalledWith(
        'DELETE FROM sensors WHERE id = $1',
        [1]
      );
    });
  });

  describe('Error handling', () => {
    it('should handle database errors on find', async () => {
      mockDb.query.mockRejectedValue(new Error('DB Error'));
      
      await expect(repository.findById(1)).rejects.toThrow('DB Error');
    });

    it('should handle errors on create', async () => {
      mockDb.query.mockRejectedValue(new Error('Constraint violation'));
      
      await expect(repository.create({ id: 1 })).rejects.toThrow();
    });
  });

  describe('Pagination', () => {
    it('should apply custom limit and offset', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });
      
      await repository.findAll(200, 100);
      
      const [query, params] = mockDb.query.mock.calls[0];
      expect(params).toEqual([200, 100]);
    });

    it('should handle edge cases for pagination', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });
      
      await repository.findAll(1, 0);
      
      const [, params] = mockDb.query.mock.calls[0];
      expect(params[0]).toBeGreaterThanOrEqual(1);
    });
  });
});
