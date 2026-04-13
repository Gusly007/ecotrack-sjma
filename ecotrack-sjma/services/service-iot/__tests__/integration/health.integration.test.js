process.env.DISABLE_AUTO_START = 'true';
process.env.NODE_ENV = 'test';
process.env.APP_PORT = '0';

jest.mock('../../src/config/config', () => ({
  PORT: 0,
  NODE_ENV: 'test',
  MQTT: { port: 1883 },
  DB: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '',
    database: 'ecotrack',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  }
}));

const mockPool = {
  query: jest.fn().mockResolvedValue({ rows: [{ now: new Date().toISOString() }] })
};

jest.mock('../../src/db/connexion', () => ({
  pool: mockPool,
  testConnection: jest.fn().mockResolvedValue(true),
  query: jest.fn()
}));

jest.mock('../../src/container-di', () => ({
  mqttBroker: {
    getAedes: jest.fn().mockReturnValue(true),
    start: jest.fn().mockResolvedValue(),
    stop: jest.fn().mockResolvedValue()
  },
  iotController: {
    getMeasurements: jest.fn(),
    getLatestMeasurements: jest.fn(),
    getMeasurementsByContainer: jest.fn(),
    getSensors: jest.fn(),
    getSensorsStatus: jest.fn(),
    getSensorById: jest.fn(),
    getAlerts: jest.fn(),
    updateAlertStatus: jest.fn(),
    getStats: jest.fn(),
    simulate: jest.fn()
  },
  alertService: {
    checkSilentSensors: jest.fn()
  }
}));

jest.mock('../../kafkaProducer', () => ({
  connect: jest.fn().mockResolvedValue(),
  disconnect: jest.fn().mockResolvedValue()
}));

jest.mock('../../src/services/centralizedLogging', () => ({
  log: jest.fn().mockResolvedValue(),
  connect: jest.fn().mockResolvedValue(),
  close: jest.fn().mockResolvedValue()
}));

const app = require('../../index');
let server;
let baseUrl;

beforeAll(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const address = server.address();
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

afterAll(() => new Promise((resolve) => server.close(resolve)));

describe('service-iot integration', () => {
  it('serves the health endpoint', async () => {
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('OK');
    expect(body.services.database).toBe('healthy');
    expect(body.services.mqtt).toBe('healthy');
  });

  it('exposes the API description endpoint', async () => {
    const response = await fetch(`${baseUrl}/api`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.endpoints.health).toBe('/health');
  });
});
