/**
 * Unit tests for IoT validators
 */

const Joi = require('joi');

// Mock validators schema
const simulateSchema = Joi.object({
  uid_capteur: Joi.string().max(30).required(),
  fill_level: Joi.number().min(0).max(100).required(),
  battery: Joi.number().min(0).max(100).required(),
  temperature: Joi.number().min(-50).max(100).allow(null).optional()
});

const alertUpdateSchema = Joi.object({
  statut: Joi.string().valid('RESOLUE', 'IGNOREE').required()
});

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(1000).default(50),
  id_conteneur: Joi.number().integer().min(1).optional(),
  type_alerte: Joi.string().valid('DEBORDEMENT', 'BATTERIE_FAIBLE', 'CAPTEUR_DEFAILLANT').optional()
});

describe('IoT Validators', () => {
  describe('simulateSchema validation', () => {
    it('should validate correct sensor data', () => {
      const validData = {
        uid_capteur: 'sensor-001',
        fill_level: 50,
        battery: 85,
        temperature: 22
      };

      const { error, value } = simulateSchema.validate(validData);
      expect(error).toBeUndefined();
      expect(value.uid_capteur).toBe('sensor-001');
      expect(value.fill_level).toBe(50);
    });

    it('should reject missing uid_capteur', () => {
      const invalidData = {
        fill_level: 50,
        battery: 85
      };

      const { error } = simulateSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.message).toContain('uid_capteur');
    });

    it('should reject fill_level > 100', () => {
      const invalidData = {
        uid_capteur: 'sensor-001',
        fill_level: 150,
        battery: 85
      };

      const { error } = simulateSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should reject negative battery', () => {
      const invalidData = {
        uid_capteur: 'sensor-001',
        fill_level: 50,
        battery: -10
      };

      const { error } = simulateSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    it('should allow null temperature', () => {
      const validData = {
        uid_capteur: 'sensor-001',
        fill_level: 50,
        battery: 85,
        temperature: null
      };

      const { error, value } = simulateSchema.validate(validData);
      expect(error).toBeUndefined();
      expect(value.temperature).toBeNull();
    });

    it('should reject temperature out of range', () => {
      const invalidData = {
        uid_capteur: 'sensor-001',
        fill_level: 50,
        battery: 85,
        temperature: 150
      };

      const { error } = simulateSchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });

  describe('alertUpdateSchema validation', () => {
    it('should validate RESOLUE status', () => {
      const data = { statut: 'RESOLUE' };
      const { error } = alertUpdateSchema.validate(data);
      expect(error).toBeUndefined();
    });

    it('should validate IGNOREE status', () => {
      const data = { statut: 'IGNOREE' };
      const { error } = alertUpdateSchema.validate(data);
      expect(error).toBeUndefined();
    });

    it('should reject invalid status', () => {
      const data = { statut: 'INVALIDE' };
      const { error } = alertUpdateSchema.validate(data);
      expect(error).toBeDefined();
    });

    it('should reject missing statut', () => {
      const data = {};
      const { error } = alertUpdateSchema.validate(data);
      expect(error).toBeDefined();
    });
  });

  describe('paginationSchema validation', () => {
    it('should validate pagination with defaults', () => {
      const data = {};
      const { value } = paginationSchema.validate(data);
      expect(value.page).toBe(1);
      expect(value.limit).toBe(50);
    });

    it('should validate custom pagination', () => {
      const data = { page: 2, limit: 100 };
      const { value } = paginationSchema.validate(data);
      expect(value.page).toBe(2);
      expect(value.limit).toBe(100);
    });

    it('should reject page < 1', () => {
      const data = { page: 0 };
      const { error } = paginationSchema.validate(data);
      expect(error).toBeDefined();
    });

    it('should reject limit > 1000', () => {
      const data = { limit: 2000 };
      const { error } = paginationSchema.validate(data);
      expect(error).toBeDefined();
    });

    it('should validate alert type filter', () => {
      const data = { type_alerte: 'DEBORDEMENT' };
      const { value } = paginationSchema.validate(data);
      expect(value.type_alerte).toBe('DEBORDEMENT');
    });

    it('should reject invalid alert type', () => {
      const data = { type_alerte: 'INVALID_TYPE' };
      const { error } = paginationSchema.validate(data);
      expect(error).toBeDefined();
    });
  });

  describe('Multiple validators combined', () => {
    it('should handle batch validation', () => {
      const sensors = [
        { uid_capteur: 's1', fill_level: 50, battery: 85 },
        { uid_capteur: 's2', fill_level: 75, battery: 60 },
        { uid_capteur: 's3', fill_level: 30, battery: 40 }
      ];

      sensors.forEach(sensor => {
        const { error } = simulateSchema.validate(sensor);
        expect(error).toBeUndefined();
      });
    });

    it('should validate realistic alert update workflow', () => {
      const alert = { statut: 'RESOLUE' };
      const { error: alertError } = alertUpdateSchema.validate(alert);
      expect(alertError).toBeUndefined();

      const pagination = { page: 1, limit: 50 };
      const { error: paginationError } = paginationSchema.validate(pagination);
      expect(paginationError).toBeUndefined();
    });
  });
});
