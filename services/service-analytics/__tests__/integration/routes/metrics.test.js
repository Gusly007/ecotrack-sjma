jest.mock('../../../src/middleware/authMiddleware', () => (req, res, next) => next());
jest.mock('../../../src/middleware/rbac', () => ({ requirePermission: () => (req, res, next) => next() }));

const mockFetch = jest.fn();
jest.mock('node-fetch', () => mockFetch);

const express = require('express');
const request = require('supertest');

function loadRouter() {
  jest.resetModules();
  return require('../../../src/routes/metrics');
}

describe('metrics routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('serves overview, services, iot, kafka and database data', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/v1/alerts')) {
        return Promise.resolve({
          json: async () => ({
            status: 'success',
            data: {
              alerts: [
                {
                  activeAt: new Date(Date.now() - 60000).toISOString(),
                  labels: { alertname: 'A', severity: 'warning', job: 'svc' },
                  annotations: {},
                  state: 'firing'
                }
              ]
            }
          })
        });
      }

      if (url.includes('/query_range')) {
        return Promise.resolve({
          json: async () => ({
            status: 'success',
            data: { result: [{ values: [[1710000000, '10']] }] }
          })
        });
      }

      const query = decodeURIComponent(url.split('query=')[1] || '');
      let result = [];
      if (query.includes('up{job=~"service-.*"}')) {
        result = [{ metric: { job: 'svc', instance: '1' }, value: [0, '1'] }];
      } else if (query.includes('up')) {
        result = [{ metric: { job: 'svc', instance: '1' }, value: [0, '1'] }];
      } else {
        result = [{ metric: {}, value: [0, '42.5'] }];
      }

      return Promise.resolve({
        json: async () => ({ status: 'success', data: { result } })
      });
    });

    const router = loadRouter();
    const app = express();
    app.use('/api/analytics', router);

    await request(app).get('/api/analytics/overview').expect(200);
    await request(app).get('/api/analytics/services').expect(200);
    await request(app).get('/api/analytics/iot').expect(200);
    await request(app).get('/api/analytics/kafka').expect(200);
    await request(app).get('/api/analytics/database').expect(200);
    await request(app).get('/api/analytics/alerts').expect(200);
    await request(app).get('/api/analytics/alerts/counts').expect(200);
    await request(app).get('/api/analytics/history?metric=memory&period=3600').expect(200);
  });

  test('falls back on failed prometheus query', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network down'));
    const router = loadRouter();
    const app = express();
    app.use('/api/analytics', router);

    await request(app).get('/api/analytics/overview').expect(200);
  });
});



