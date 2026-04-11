jest.mock('node-cron', () => ({
  schedule: jest.fn()
}));

jest.mock('../../../src/services/aggregationService', () => ({
  refreshAll: jest.fn()
}));

jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

const cron = require('node-cron');
const AggregationService = require('../../../src/services/aggregationService');
const logger = require('../../../src/utils/logger');
const { setupCronJobs } = require('../../../src/config/cron');

describe('cron config', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('setupCronJobs schedules hourly refresh and logs success and failure', async () => {
    cron.schedule.mockImplementation(() => ({}));

    setupCronJobs();

    expect(cron.schedule).toHaveBeenCalledWith('0 * * * *', expect.any(Function));
    expect(logger.info).toHaveBeenCalledWith(' Cron jobs configured');

    const firstCallback = cron.schedule.mock.calls[0][1];
    await firstCallback();
    expect(AggregationService.refreshAll).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith('Hourly aggregation refresh completed');

    AggregationService.refreshAll.mockRejectedValueOnce(new Error('boom'));
    await firstCallback();
    expect(logger.error).toHaveBeenCalledWith('Hourly aggregation refresh failed:', expect.any(Error));
  });
});


