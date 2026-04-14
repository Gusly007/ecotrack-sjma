import { jest } from '@jest/globals';

const mockUserRepository = {
  getActiveUsers: jest.fn(),
  getTotalUsers: jest.fn()
};

const mockDatabaseRepository = {
  getDatabaseSize: jest.fn()
};

const mockLogRepository = {
  query: jest.fn()
};

jest.unstable_mockModule('../../src/repositories/index.js', () => ({
  userRepository: mockUserRepository,
  databaseRepository: mockDatabaseRepository,
  logRepository: mockLogRepository
}));

jest.unstable_mockModule('../../src/middleware/logger.js', () => ({
  default: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
  },
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn()
}));

const { default: dashboardStatsService } = await import('../../src/services/dashboardStats.js');

describe('dashboardStatsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getTotalRequests should parse count', async () => {
    mockLogRepository.query.mockResolvedValue({ rows: [{ count: '120' }] });

    const result = await dashboardStatsService.getTotalRequests();

    expect(result).toBe(120);
  });

  it('getTotalRequests should return 0 when query fails', async () => {
    mockLogRepository.query.mockRejectedValue(new Error('request count failed'));

    const result = await dashboardStatsService.getTotalRequests();

    expect(result).toBe(0);
  });

  it('calculateUptime should compute percentage from up/down counts', async () => {
    mockLogRepository.query.mockResolvedValue({ rows: [{ up_count: '95', down_count: '5' }] });

    const result = await dashboardStatsService.calculateUptime();

    expect(result).toBe('95.00%');
  });

  it('calculateUptime should fallback to default uptime on failure', async () => {
    mockLogRepository.query.mockRejectedValue(new Error('db error'));

    const result = await dashboardStatsService.calculateUptime();

    expect(result).toBe('99.98%');
  });

  it('calculateUptime should return default when computed total is zero', async () => {
    mockLogRepository.query.mockResolvedValue({ rows: [{ up_count: '0', down_count: '-1' }] });

    const result = await dashboardStatsService.calculateUptime();

    expect(result).toBe('99.98%');
  });

  it('getStats should compose output from repositories', async () => {
    mockUserRepository.getActiveUsers.mockResolvedValue(15);
    mockUserRepository.getTotalUsers.mockResolvedValue(120);
    mockDatabaseRepository.getDatabaseSize.mockResolvedValue({
      usedPretty: '12 GB',
      usedBytes: 12884901888,
      totalBytes: 53687091200,
      percentage: 24
    });
    mockLogRepository.query
      .mockResolvedValueOnce({ rows: [{ count: '1800' }] })
      .mockResolvedValueOnce({ rows: [{ up_count: '99', down_count: '1' }] });

    const result = await dashboardStatsService.getStats();

    expect(result).toEqual({
      activeUsers: 15,
      totalUsers: 120,
      dbSize: '12 GB',
      dbUsed: 12884901888,
      dbTotal: 53687091200,
      dbPercentage: 24,
      requestsPerMin: 30,
      uptime: '99.00%'
    });
  });

  it('getStats should apply default requestsPerMin when requests are zero', async () => {
    mockUserRepository.getActiveUsers.mockResolvedValue(1);
    mockUserRepository.getTotalUsers.mockResolvedValue(2);
    mockDatabaseRepository.getDatabaseSize.mockResolvedValue({
      usedPretty: '1 GB',
      usedBytes: 1,
      totalBytes: 2,
      percentage: 50
    });
    mockLogRepository.query
      .mockResolvedValueOnce({ rows: [{ count: '0' }] })
      .mockResolvedValueOnce({ rows: [{ up_count: '1', down_count: '0' }] });

    const result = await dashboardStatsService.getStats();

    expect(result.requestsPerMin).toBe(17);
  });

  it('getStats should rethrow when one dependency fails', async () => {
    mockUserRepository.getActiveUsers.mockRejectedValue(new Error('users failed'));

    await expect(dashboardStatsService.getStats()).rejects.toThrow('users failed');
  });
});