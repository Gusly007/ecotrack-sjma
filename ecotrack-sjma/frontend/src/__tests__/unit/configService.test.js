import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { configService } from '../services/configService';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn()
  }
}));

describe('configService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'mock-token');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getSecurity', () => {
    it('should fetch security configuration from /admin/config', async () => {
      const mockData = {
        'jwt.access_token_expiration': { value: '24h', type: 'string' },
        'security.bcrypt_rounds': { value: 10, type: 'number' }
      };
      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await configService.getSecurity();

      expect(api.get).toHaveBeenCalledWith('/admin/config');
      expect(result).toEqual(mockData);
    });

    it('should handle API errors', async () => {
      api.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(configService.getSecurity()).resolves.toEqual({});
    });
  });

  describe('getEnvironmental', () => {
    it('should fetch environmental constants from /admin/environmental-constants', async () => {
      const mockData = {
        'CO2_PER_KM': { value: 0.85, unite: 'kg/km' },
        'FUEL_PRICE_PER_LITER': { value: 1.65, unite: '€/L' }
      };
      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await configService.getEnvironmental();

      expect(api.get).toHaveBeenCalledWith('/admin/environmental-constants');
      expect(result).toEqual(mockData);
    });
  });

  describe('getPerformance', () => {
    it('should fetch performance constants from /admin/agent-performance', async () => {
      const mockData = {
        'COLLECTION_RATE_WEIGHT': { value: 0.4, unite: '%' },
        'COMPLETION_RATE_WEIGHT': { value: 0.3, unite: '%' }
      };
      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await configService.getPerformance();

      expect(api.get).toHaveBeenCalledWith('/admin/agent-performance');
      expect(result).toEqual(mockData);
    });
  });

  describe('getAll', () => {
    it('should fetch all configurations in parallel', async () => {
      const securityData = { 'jwt.access_token_expiration': { value: '24h' } };
      const environmentalData = { 'CO2_PER_KM': { value: 0.85 } };
      const performanceData = { 'COLLECTION_RATE_WEIGHT': { value: 0.4 } };

      api.get
        .mockResolvedValueOnce({ data: securityData })
        .mockResolvedValueOnce({ data: environmentalData })
        .mockResolvedValueOnce({ data: performanceData });

      const result = await configService.getAll();

      expect(api.get).toHaveBeenCalledTimes(3);
      expect(result).toEqual({
        security: securityData,
        environmental: environmentalData,
        performance: performanceData
      });
    });

    it('should handle partial failures', async () => {
      api.get
        .mockResolvedValueOnce({ data: { test: 'value' } })
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({ data: { test: 'value2' } });

      await expect(configService.getAll()).resolves.toEqual({
        security: { test: 'value' },
        environmental: {},
        performance: { test: 'value2' }
      });
    });
  });

  describe('updateSecurity', () => {
    it('should update a security configuration key', async () => {
      const mockResponse = { success: true, message: "Config updated" };
      api.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await configService.updateSecurity('security.bcrypt_rounds', 12);

      expect(api.put).toHaveBeenCalledWith('/admin/config/security.bcrypt_rounds', { value: 12 });
      expect(result).toEqual(mockResponse);
    });

    it('should handle JWT token format correctly', async () => {
      const mockResponse = { success: true };
      api.put.mockResolvedValueOnce({ data: mockResponse });

      await configService.updateSecurity('jwt.access_token_expiration', '24h');

      expect(api.put).toHaveBeenCalledWith('/admin/config/jwt.access_token_expiration', { value: '24h' });
    });
  });

  describe('updateEnvironmental', () => {
    it('should update an environmental constant', async () => {
      const mockResponse = { success: true, value: 2.0 };
      api.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await configService.updateEnvironmental('CO2_PER_KM', 2.0);

      expect(api.put).toHaveBeenCalledWith('/admin/environmental-constants/CO2_PER_KM', { value: 2.0 });
      expect(result).toEqual(mockResponse);
    });

    it('should handle invalid keys gracefully', async () => {
      api.put.mockRejectedValueOnce({ response: { status: 404 } });

      await expect(configService.updateEnvironmental('INVALID_KEY', 1)).rejects.toEqual({ response: { status: 404 } });
    });
  });

  describe('updatePerformance', () => {
    it('should update a performance constant', async () => {
      const mockResponse = { success: true, value: 0.5 };
      api.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await configService.updatePerformance('COLLECTION_RATE_WEIGHT', 0.5);

      expect(api.put).toHaveBeenCalledWith('/admin/agent-performance/COLLECTION_RATE_WEIGHT', { value: 0.5 });
      expect(result).toEqual(mockResponse);
    });

    it('should handle validation errors', async () => {
      api.put.mockRejectedValueOnce({ 
        response: { status: 400, data: { error: 'Value must be between 0.1 and 1' } }
      });

      await expect(configService.updatePerformance('COLLECTION_RATE_WEIGHT', 1.5)).rejects.toEqual({
        response: { status: 400, data: { error: 'Value must be between 0.1 and 1' } }
      });
    });
  });
});