import { jest } from '@jest/globals';

describe('HealthCheck Service', () => {
  let HealthCheckService;
  let healthCheckService;
  let mockAxios;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock axios
    mockAxios = {
      get: jest.fn()
    };

    jest.unstable_mockModule('axios', () => ({
      default: mockAxios,
      get: mockAxios.get
    }));

    const module = await import('../../src/services/healthCheck.js');
    HealthCheckService = module.HealthCheckService;
    
    // Create a fresh instance for each test
    healthCheckService = new HealthCheckService();
  });

  afterEach(() => {
    jest.useRealTimers();
    if (healthCheckService) {
      healthCheckService.stopPeriodicChecks();
    }
  });

  describe('registerService', () => {
    it('should register a new service', () => {
      healthCheckService.registerService('test-service', {
        displayName: 'Test Service',
        baseUrl: 'http://localhost:3000',
        healthEndpoint: '/health'
      });

      const services = healthCheckService.getAllServices();
      expect(services).toHaveLength(1);
      expect(services[0].name).toBe('Test Service');
    });

    it('should set default values for optional fields', () => {
      healthCheckService.registerService('minimal-service', {
        baseUrl: 'http://localhost:3001'
      });

      const status = healthCheckService.getServiceStatus('minimal-service');
      expect(status.name).toBe('minimal-service');
    });
  });

  describe('checkService', () => {
    it('should return pending status for unconfigured service', async () => {
      const result = await healthCheckService.checkService('non-existent');
      
      expect(result.status).toBe('pending');
      expect(result.message).toBe('Service not configured');
    });

    it('should return up status for healthy service', async () => {
      healthCheckService.registerService('healthy-service', {
        displayName: 'Healthy Service',
        baseUrl: 'http://localhost:3000'
      });

      mockAxios.get.mockResolvedValue({
        status: 200,
        data: { status: 'ok' }
      });

      const result = await healthCheckService.checkService('healthy-service');
      
      expect(result.status).toBe('up');
      expect(result.latency).toMatch(/\d+ms/);
      expect(result.lastCheck).toBeDefined();
      expect(result.details).toEqual({ status: 'ok' });
    });

    it('should handle service returning 4xx status', async () => {
      healthCheckService.registerService('warning-service', {
        displayName: 'Warning Service',
        baseUrl: 'http://localhost:3000'
      });

      mockAxios.get.mockResolvedValue({
        status: 404,
        data: { error: 'Not found' }
      });

      const result = await healthCheckService.checkService('warning-service');
      
      expect(result.status).toBe('up'); // 4xx is still considered up
    });

    it('should mark service as down after consecutive failures', async () => {
      healthCheckService.registerService('failing-service', {
        displayName: 'Failing Service',
        baseUrl: 'http://localhost:3000'
      });

      mockAxios.get.mockRejectedValue(new Error('Connection refused'));

      // First failure - degraded
      let result = await healthCheckService.checkService('failing-service');
      expect(result.status).toBe('degraded');
      expect(result.consecutiveFailures).toBe(1);

      // Second failure - degraded
      result = await healthCheckService.checkService('failing-service');
      expect(result.status).toBe('degraded');
      expect(result.consecutiveFailures).toBe(2);

      // Third failure - down
      result = await healthCheckService.checkService('failing-service');
      expect(result.status).toBe('down');
      expect(result.consecutiveFailures).toBe(3);
    });

    it('should reset consecutive failures after successful check', async () => {
      healthCheckService.registerService('recovering-service', {
        displayName: 'Recovering Service',
        baseUrl: 'http://localhost:3000'
      });

      // First failure
      mockAxios.get.mockRejectedValue(new Error('Connection refused'));
      await healthCheckService.checkService('recovering-service');

      // Then success
      mockAxios.get.mockResolvedValue({
        status: 200,
        data: { status: 'ok' }
      });
      
      const result = await healthCheckService.checkService('recovering-service');
      
      expect(result.status).toBe('up');
      expect(result.consecutiveFailures).toBe(0);
    });

    it('should include error message when service is down', async () => {
      healthCheckService.registerService('error-service', {
        displayName: 'Error Service',
        baseUrl: 'http://localhost:3000'
      });

      mockAxios.get.mockRejectedValue(new Error('Network timeout'));

      // Trigger 3 failures
      await healthCheckService.checkService('error-service');
      await healthCheckService.checkService('error-service');
      const result = await healthCheckService.checkService('error-service');
      
      expect(result.status).toBe('down');
      expect(result.error).toBe('Network timeout');
    });
  });

  describe('checkAllServices', () => {
    it('should check all registered services', async () => {
      healthCheckService.registerService('service-1', {
        displayName: 'Service 1',
        baseUrl: 'http://localhost:3001'
      });
      
      healthCheckService.registerService('service-2', {
        displayName: 'Service 2',
        baseUrl: 'http://localhost:3002'
      });

      mockAxios.get
        .mockResolvedValueOnce({ status: 200, data: {} })
        .mockResolvedValueOnce({ status: 200, data: {} });

      const results = await healthCheckService.checkAllServices();
      
      expect(results).toHaveLength(2);
      expect(mockAxios.get).toHaveBeenCalledTimes(2);
    });

    it('should return empty array if no services registered', async () => {
      const results = await healthCheckService.checkAllServices();
      
      expect(results).toEqual([]);
    });
  });

  describe('getOverallStatus', () => {
    it('should return healthy status when all services are up', async () => {
      healthCheckService.registerService('service-1', {
        displayName: 'Service 1',
        baseUrl: 'http://localhost:3001'
      });

      mockAxios.get.mockResolvedValue({ status: 200, data: {} });

      const status = await healthCheckService.getOverallStatus();
      
      expect(status.status).toBe('healthy');
      expect(status.timestamp).toBeDefined();
      expect(status.uptime).toBeDefined();
      expect(status.gateway.status).toBe('up');
      expect(status.services['Service 1'].status).toBe('up');
    });

    it('should return degraded status when some services are degraded', async () => {
      healthCheckService.registerService('service-1', {
        displayName: 'Service 1',
        baseUrl: 'http://localhost:3001'
      });
      
      healthCheckService.registerService('service-2', {
        displayName: 'Service 2',
        baseUrl: 'http://localhost:3002'
      });

      mockAxios.get
        .mockResolvedValueOnce({ status: 200, data: {} })
        .mockRejectedValueOnce(new Error('Timeout'));

      const status = await healthCheckService.getOverallStatus();
      
      expect(status.status).toBe('degraded');
    });

    it('should return unhealthy status when services are down', async () => {
      healthCheckService.registerService('failing-service', {
        displayName: 'Failing Service',
        baseUrl: 'http://localhost:3001'
      });

      mockAxios.get.mockRejectedValue(new Error('Connection refused'));

      // Trigger 3 failures to mark as down
      await healthCheckService.checkService('failing-service');
      await healthCheckService.checkService('failing-service');
      await healthCheckService.checkService('failing-service');

      const status = await healthCheckService.getOverallStatus();
      
      expect(status.status).toBe('unhealthy');
    });
  });

  describe('periodic checks', () => {
    it('should start periodic checks automatically', () => {
      healthCheckService.registerService('test-service', {
        displayName: 'Test Service',
        baseUrl: 'http://localhost:3000'
      });

      mockAxios.get.mockResolvedValue({ status: 200, data: {} });

      // Fast-forward timers to trigger periodic checks
      jest.advanceTimersByTime(30000);
      
      // Should have been called at least once
      expect(mockAxios.get).toHaveBeenCalled();
    });

    it('should allow stopping periodic checks', () => {
      healthCheckService.stopPeriodicChecks();
      
      const initialCalls = mockAxios.get.mock.calls.length;
      
      jest.advanceTimersByTime(60000);
      
      // Should not have been called after stopping
      expect(mockAxios.get.mock.calls.length).toBe(initialCalls);
    });
  });

  describe('getServiceStatus', () => {
    it('should return status for specific service', async () => {
      healthCheckService.registerService('test-service', {
        displayName: 'Test Service',
        baseUrl: 'http://localhost:3000'
      });

      mockAxios.get.mockResolvedValue({ status: 200, data: {} });
      await healthCheckService.checkService('test-service');

      const status = healthCheckService.getServiceStatus('test-service');
      
      expect(status.name).toBe('Test Service');
      expect(status.status).toBe('up');
    });

    it('should return null for non-existent service', () => {
      const status = healthCheckService.getServiceStatus('non-existent');
      
      expect(status).toBeNull();
    });
  });

  describe('getAllServices', () => {
    it('should return all registered services', () => {
      healthCheckService.registerService('service-1', {
        displayName: 'Service 1',
        baseUrl: 'http://localhost:3001'
      });
      
      healthCheckService.registerService('service-2', {
        displayName: 'Service 2',
        baseUrl: 'http://localhost:3002'
      });

      const services = healthCheckService.getAllServices();
      
      expect(services).toHaveLength(2);
      expect(services[0].name).toBe('Service 1');
      expect(services[1].name).toBe('Service 2');
    });

    it('should return empty array if no services registered', () => {
      const services = healthCheckService.getAllServices();
      
      expect(services).toEqual([]);
    });
  });
});
