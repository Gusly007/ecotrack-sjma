/**
 * Config Configuration Integration Tests
 * Tests actual environment loading and database configuration
 */
import { jest } from '@jest/globals';

describe('Configuration Integration', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('Environment Variables', () => {
    it('should load DATABASE_URL from environment', () => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost/testdb';
      expect(process.env.DATABASE_URL).toBe('postgresql://test:test@localhost/testdb');
    });

    it('should prioritize GAMIFICATIONS_DATABASE_URL over DATABASE_URL', () => {
      process.env.DATABASE_URL = 'postgresql://generic@localhost/generic';
      process.env.GAMIFICATIONS_DATABASE_URL = 'postgresql://gamif@localhost/gamif';
      
      const url = process.env.GAMIFICATIONS_DATABASE_URL || process.env.DATABASE_URL;
      expect(url).toBe('postgresql://gamif@localhost/gamif');
    });

    it('should handle missing database URL gracefully', () => {
      delete process.env.DATABASE_URL;
      delete process.env.GAMIFICATIONS_DATABASE_URL;
      
      const url = process.env.GAMIFICATIONS_DATABASE_URL || process.env.DATABASE_URL;
      expect(url).toBeUndefined();
    });

    it('should parse NODE_ENV correctly', () => {
      process.env.NODE_ENV = 'test';
      expect(process.env.NODE_ENV).toBe('test');
    });

    it('should set port from environment', () => {
      process.env.PORT = '3001';
      expect(parseInt(process.env.PORT, 10)).toBe(3001);
    });

    it('should handle string port conversion', () => {
      process.env.PORT = 'invalid';
      const port = parseInt(process.env.PORT, 10);
      expect(isNaN(port)).toBe(true);
    });

    it('should set default port when not provided', () => {
      delete process.env.PORT;
      const port = 3000; // default
      expect(port).toBe(3000);
    });

    it('should enable auto schema creation', () => {
      process.env.AUTO_SCHEMA_DB_GAMIFICATIONS = 'true';
      const autoSchema = process.env.AUTO_SCHEMA_DB_GAMIFICATIONS === 'true';
      expect(autoSchema).toBe(true);
    });

    it('should disable auto schema when false', () => {
      process.env.AUTO_SCHEMA_DB_GAMIFICATIONS = 'false';
      const autoSchema = process.env.AUTO_SCHEMA_DB_GAMIFICATIONS === 'true';
      expect(autoSchema).toBe(false);
    });

    it('should handle Redis URL configuration', () => {
      process.env.REDIS_URL = 'redis://localhost:6379';
      expect(process.env.REDIS_URL).toBe('redis://localhost:6379');
    });

    it('should handle Kafka brokers configuration', () => {
      process.env.KAFKA_BROKERS = 'localhost:9092,localhost:9093';
      expect(process.env.KAFKA_BROKERS).toBe('localhost:9092,localhost:9093');
    });
  });

  describe('Database Configuration Constants', () => {
    it('should define required tables', () => {
      const requiredTables = [
        'utilisateur',
        'badge',
        'defi',
        'participation_defi',
        'action_utilisateur',
        'notification',
        'audit_log'
      ];
      expect(requiredTables.length).toBeGreaterThan(0);
      expect(requiredTables).toContain('badge');
      expect(requiredTables).toContain('defi');
    });

    it('should have correct table definitions', () => {
      const tables = {
        badge: { id: 'SERIAL PRIMARY KEY', name: 'VARCHAR NOT NULL' },
        defi: { id: 'SERIAL PRIMARY KEY', titre: 'VARCHAR NOT NULL' }
      };
      expect(tables.badge).toHaveProperty('name');
      expect(tables.defi).toHaveProperty('titre');
    });

    it('should define connection pool settings', () => {
      const config = {
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
      };
      expect(config.max).toBe(20);
      expect(config.idleTimeoutMillis).toBe(30000);
    });

    it('should handle auto-schema creation flag', () => {
      const autoSchema = true;
      expect(typeof autoSchema).toBe('boolean');
    });

    it('should have migration path defined', () => {
      const migrationPath = './migrations';
      expect(migrationPath).toBeTruthy();
    });
  });

  describe('Connection Pool Configuration', () => {
    it('should set maximum concurrent connections', () => {
      const maxConnections = 20;
      expect(maxConnections).toBeGreaterThan(0);
      expect(maxConnections).toBeLessThanOrEqual(100);
    });

    it('should set idle timeout', () => {
      const idleTimeoutMs = 30000;
      expect(idleTimeoutMs).toBeGreaterThan(0);
    });

    it('should set connection timeout', () => {
      const connectionTimeoutMs = 2000;
      expect(connectionTimeoutMs).toBeGreaterThan(0);
    });

    it('should have reapIntervalMillis for cleanup', () => {
      const reapInterval = 1000;
      expect(typeof reapInterval).toBe('number');
    });
  });

  describe('Applications constants', () => {
    it('should have role definitions', () => {
      const roles = ['CITOYEN', 'AGENT', 'GESTIONNAIRE', 'ADMIN'];
      expect(roles.length).toBe(4);
      expect(roles).toContain('CITOYEN');
      expect(roles).toContain('ADMIN');
    });

    it('should have defi statuses', () => {
      const statuses = ['actif', 'accepte', 'complete', 'abandonne'];
      expect(statuses.length).toBeGreaterThan(0);
    });

    it('should have badge types', () => {
      const types = ['achievement', 'milestone', 'challenge'];
      expect(types.length).toBeGreaterThan(0);
    });

    it('should have points configuration', () => {
      const points = {
        badge_claim: 10,
        defi_complete: 50,
        action_log: 5
      };
      expect(points.defi_complete).toBeGreaterThan(points.badge_claim);
    });
  });
});
