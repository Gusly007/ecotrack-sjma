jest.mock('../../../src/utils/logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
}));

jest.mock('../../../src/utils/dateUtils', () => ({
  formatDate: jest.fn(() => '10/04')
}));

jest.mock('chartjs-node-canvas', () => ({
  ChartJSNodeCanvas: jest.fn().mockImplementation(() => ({
    renderToBuffer: jest.fn().mockResolvedValue(Buffer.from('chart'))
  }))
}));

const ChartService = require('../../../src/services/chartService');

describe('ChartService', () => {
  test('prepareChartData maps evolution data', () => {
    const result = ChartService.prepareChartData([
      { date: '2026-04-10', avg_fill_level: 10, max_fill_level: 20 },
      { date: '2026-04-11', avg_fill_level: 15, max_fill_level: 25 }
    ]);

    expect(result.labels).toEqual(['10/04', '10/04']);
    expect(result.datasets).toHaveLength(2);
  });

  test('generateLineChart and generateBarChart return null when canvas unavailable or buffer when available', async () => {
    const service = new ChartService();
    service.chartJSNodeCanvas = { renderToBuffer: jest.fn().mockResolvedValue(Buffer.from('line')) };

    await expect(service.generateLineChart({ labels: ['a'], values: [1] })).resolves.toEqual(Buffer.from('line'));
    await expect(service.generateBarChart({ labels: ['a'], values: [1] })).resolves.toEqual(Buffer.from('line'));

    service.chartJSNodeCanvas = null;
    await expect(service.generateLineChart({ labels: [], values: [] })).resolves.toBeNull();
    await expect(service.generateBarChart({ labels: [], values: [] })).resolves.toBeNull();
  });
});



