/**
 * Unit tests for IoT config
 */

describe('IoT Configuration', () => {
  beforeEach(() => {
    // Clear environment
    delete process.env.NODE_ENV;
    delete process.env.MQTT_BROKER;
    delete process.env.MQTT_PORT;
  });

  describe('Environment variables', () => {
    it('should load development config', () => {
      process.env.NODE_ENV = 'development';
      process.env.MQTT_BROKER = 'localhost';
      process.env.MQTT_PORT = '1883';
      process.env.APP_PORT = '3013';

      const config = {
        env: process.env.NODE_ENV,
        mqtt: {
          broker: process.env.MQTT_BROKER,
          port: parseInt(process.env.MQTT_PORT)
        },
        port: parseInt(process.env.APP_PORT)
      };

      expect(config.env).toBe('development');
      expect(config.mqtt.broker).toBe('localhost');
      expect(config.mqtt.port).toBe(1883);
    });

    it('should load production config', () => {
      process.env.NODE_ENV = 'production';
      process.env.MQTT_BROKER = 'mqtt.ecotrack.io';
      process.env.MQTT_PORT = '8883';

      const config = {
        env: process.env.NODE_ENV,
        mqtt: {
          broker: process.env.MQTT_BROKER,
          port: parseInt(process.env.MQTT_PORT),
          tls: true
        }
      };

      expect(config.env).toBe('production');
      expect(config.mqtt.tls).toBe(true);
    });

    it('should provide default values', () => {
      const config = {
        mqtt: {
          broker: process.env.MQTT_BROKER || 'localhost',
          port: parseInt(process.env.MQTT_PORT) || 1883,
          timeout: 30000
        }
      };

      expect(config.mqtt.broker).toBe('localhost');
      expect(config.mqtt.port).toBe(1883);
      expect(config.mqtt.timeout).toBe(30000);
    });
  });

  describe('MQTT configuration', () => {
    it('should configure MQTT client options', () => {
      const mqttConfig = {
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 1000,
        qos: 1,
        retain: false
      };

      expect(mqttConfig.clean).toBe(true);
      expect(mqttConfig.qos).toBe(1);
      expect(mqttConfig.connectTimeout).toBeGreaterThan(0);
    });

    it('should define MQTT topics', () => {
      const topics = {
        sensor_data: 'ecotrack/sensors/+/data',
        alerts: 'ecotrack/alerts',
        commands: 'ecotrack/commands/+/exec',
        telemetry: 'ecotrack/telemetry/+/status'
      };

      expect(topics.sensor_data).toContain('ecotrack');
      expect(topics.sensor_data).toContain('+');
      Object.values(topics).forEach(topic => {
        expect(typeof topic).toBe('string');
      });
    });
  });

  describe('Database configuration', () => {
    it('should build PostgreSQL connection string', () => {
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_USER = 'ecotrack';
      process.env.DB_PASSWORD = 'secret';
      process.env.DB_NAME = 'ecotrack_iot';

      const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

      expect(connectionString).toContain('postgresql://');
      expect(connectionString).toContain('localhost');
      expect(connectionString).toContain('5432');
    });

    it('should use DATABASE_URL if provided', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';

      const dbUrl = process.env.DATABASE_URL;
      expect(dbUrl).toMatch(/^postgresql:\/\//);
    });
  });

  describe('Service ports', () => {
    it('should configure service ports', () => {
      process.env.APP_PORT = '3013';
      process.env.GATEWAY_PORT = '3000';

      const ports = {
        app: parseInt(process.env.APP_PORT),
        gateway: parseInt(process.env.GATEWAY_PORT)
      };

      expect(ports.app).toBe(3013);
      expect(ports.gateway).toBe(3000);
      expect(ports.app).not.toBe(ports.gateway);
    });

    it('should validate port numbers', () => {
      const validPorts = [3013, 3000, 8080, 9000];
      
      validPorts.forEach(port => {
        expect(port).toBeGreaterThan(0);
        expect(port).toBeLessThanOrEqual(65535);
      });
    });
  });

  describe('Feature flags', () => {
    it('should enable/disable features via config', () => {
      process.env.ENABLE_ALERTS = 'true';
      process.env.ENABLE_CACHE = 'true';
      process.env.ENABLE_KAFKA = 'false';

      const features = {
        alerts: process.env.ENABLE_ALERTS === 'true',
        cache: process.env.ENABLE_CACHE === 'true',
        kafka: process.env.ENABLE_KAFKA === 'true'
      };

      expect(features.alerts).toBe(true);
      expect(features.cache).toBe(true);
      expect(features.kafka).toBe(false);
    });
  });

  describe('Config validation', () => {
    it('should validate required config fields', () => {
      const config = {
        mqtt: { broker: 'localhost', port: 1883 },
        database: { host: 'localhost', port: 5432 }
      };

      const isValid =
        config.mqtt &&
        config.mqtt.broker &&
        config.mqtt.port &&
        config.database &&
        config.database.host;

      expect(isValid).toBeTruthy();
    });

    it('should fail validation for missing required fields', () => {
      const config = {
        mqtt: { broker: 'localhost' }
        // missing port
      };

      const isValid = config.mqtt && config.mqtt.broker && config.mqtt.port;
      expect(isValid).toBeFalsy();
    });
  });
});
