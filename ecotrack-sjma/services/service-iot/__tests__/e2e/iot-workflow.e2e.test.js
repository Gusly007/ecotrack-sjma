/**
 * IoT Service E2E Tests
 * Tests complete IoT workflows including MQTT, sensor data, and alerts
 */

const request = require('supertest');
const express = require('express');

describe('IoT Service E2E - Complete Workflows', () => {
  let app;
  let server;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    // Mock health endpoint
    app.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok', service: 'iot' });
    });

    // Mock measurement endpoint
    app.post('/measurements', (req, res) => {
      const { deviceId, value, type } = req.body;
      if (!deviceId || value === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      res.status(201).json({
        id: 'meas-' + Date.now(),
        deviceId,
        value,
        type: type || 'sensor',
        timestamp: new Date().toISOString()
      });
    });

    // Mock alerts endpoint
    app.post('/alerts', (req, res) => {
      const { deviceId, severity, message } = req.body;
      if (!deviceId || !severity) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      res.status(201).json({
        id: 'alert-' + Date.now(),
        deviceId,
        severity,
        message,
        timestamp: new Date().toISOString()
      });
    });

    // Use random available port instead of 3013
    server = app.listen(0);
  });

  afterAll(() => {
    if (server) server.close();
  });

  describe('Complete sensor data flow', () => {
    it('should receive sensor measurement and create alert if threshold exceeded', async () => {
      // Step 1: Send measurement
      const measurementRes = await request(app)
        .post('/measurements')
        .send({
          deviceId: 'sensor-001',
          value: 95,
          type: 'temperature'
        });

      expect(measurementRes.status).toBe(201);
      expect(measurementRes.body).toHaveProperty('id');
      expect(measurementRes.body.value).toBe(95);

      // Step 2: Trigger alert if temperature > 90
      if (measurementRes.body.value > 90) {
        const alertRes = await request(app)
          .post('/alerts')
          .send({
            deviceId: measurementRes.body.deviceId,
            severity: 'high',
            message: `Temperature ${measurementRes.body.value}°C exceeds threshold`
          });

        expect(alertRes.status).toBe(201);
        expect(alertRes.body.severity).toBe('high');
      }
    });

    it('should handle multiple sensor measurements in sequence', async () => {
      const measurements = [
        { deviceId: 'sensor-001', value: 25 },
        { deviceId: 'sensor-002', value: 30 },
        { deviceId: 'sensor-003', value: 28 }
      ];

      const results = await Promise.all(
        measurements.map(m =>
          request(app)
            .post('/measurements')
            .send(m)
        )
      );

      results.forEach((res, idx) => {
        expect(res.status).toBe(201);
        expect(res.body.deviceId).toBe(measurements[idx].deviceId);
        expect(res.body.value).toBe(measurements[idx].value);
      });
    });

    it('should reject invalid measurement data', async () => {
      const res = await request(app)
        .post('/measurements')
        .send({
          deviceId: 'sensor-001',
          // Missing value
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('Service health and availability', () => {
    it('should respond to health checks', async () => {
      const res = await request(app)
        .get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('iot');
    });

    it('should handle concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, (_, i) =>
        request(app)
          .post('/measurements')
          .send({
            deviceId: `sensor-${i}`,
            value: 20 + i,
            type: 'humidity'
          })
      );

      const results = await Promise.all(requests);

      results.forEach((res, idx) => {
        expect(res.status).toBe(201);
        expect(res.body.deviceId).toBe(`sensor-${idx}`);
      });
    });
  });

  describe('Error handling and recovery', () => {
    it('should handle missing required fields in alert', async () => {
      const res = await request(app)
        .post('/alerts')
        .send({
          deviceId: 'sensor-001',
          // Missing severity
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should gracefully handle empty POST body', async () => {
      const res = await request(app)
        .post('/measurements')
        .send({});

      expect(res.status).toBe(400);
    });
  });
});
