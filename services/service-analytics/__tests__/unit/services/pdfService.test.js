const { EventEmitter } = require('events');

jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => {
    const doc = {
      page: { width: 595.28, margins: { left: 50, right: 50 } },
      y: 100,
      pipe: jest.fn(),
      fontSize: jest.fn().mockReturnThis(),
      fillColor: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      moveDown: jest.fn().mockReturnThis(),
      image: jest.fn().mockReturnThis(),
      addPage: jest.fn().mockReturnThis(),
      end: jest.fn(),
      on: jest.fn(),
      emit: jest.fn()
    };

    doc.end.mockImplementation(() => {
      if (doc._stream) {
        setImmediate(() => doc._stream.emit('finish'));
      }
    });

    doc.pipe.mockImplementation((stream) => {
      doc._stream = stream;
      return stream;
    });

    return doc;
  });
});

jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

jest.mock('../../../src/services/chartService', () => {
  return jest.fn().mockImplementation(() => mockChartService);
});

const mockChartService = {
  generateBarChart: jest.fn(),
  generateLineChart: jest.fn()
};

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  createWriteStream: jest.fn(),
  statSync: jest.fn()
}));

jest.mock('../../../src/utils/dateUtils', () => ({
  formatDate: jest.fn(() => '10/04/2026')
}));

const PDFDocument = require('pdfkit');
const fs = require('fs');
const logger = require('../../../src/utils/logger');
const ChartService = require('../../../src/services/chartService');
const DateUtils = require('../../../src/utils/dateUtils');
const PDFService = require('../../../src/services/pdfService');

function createStream() {
  return new EventEmitter();
}

function createDocMock() {
  return {
    page: { width: 600, margins: { left: 50, right: 50 } },
    y: 100,
    image: jest.fn(),
    moveDown: jest.fn(),
    fontSize: jest.fn().mockReturnThis(),
    fillColor: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    addPage: jest.fn().mockReturnThis(),
    end: jest.fn()
  };
}

describe('PDFService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, REPORTS_DIR: 'D:/reports' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('_addChartToDoc handles null and render errors', async () => {
    const doc = createDocMock();

    await PDFService._addChartToDoc(doc, null);
    expect(logger.warn).toHaveBeenCalledWith('Chart buffer is null, skipping chart insertion');

    doc.image.mockImplementationOnce(() => {
      throw new Error('render failed');
    });

    await PDFService._addChartToDoc(doc, Buffer.from('chart'), { width: 200, height: 100, align: 'center' });
    expect(logger.error).toHaveBeenCalledWith('Error adding chart to PDF:', expect.any(Error));
  });

  test('generateReport builds a daily report and resolves metadata', async () => {
    const stream = createStream();
    fs.existsSync.mockReturnValueOnce(false);
    fs.createWriteStream.mockReturnValueOnce(stream);
    fs.statSync.mockImplementation(() => ({ size: 1234 }));
    jest.spyOn(Date, 'now').mockReturnValue(1700000000000);

    const resultPromise = PDFService.generateReport(
      {
        completedRoutes: 3,
        containersCollected: 8,
        totalDistance: 42,
        resolvedReports: 5,
        criticalContainers: 2,
        routes: [{ code: 'R-1', agentName: 'Alex', distance: 12, duration: 30 }]
      },
      'daily'
    );

    await Promise.resolve();
    stream.emit('finish');

    await expect(resultPromise).resolves.toEqual(
      expect.objectContaining({
        fileName: 'report_daily_1700000000000.pdf',
        url: '/reports/report_daily_1700000000000.pdf',
        size: 1234
      })
    );

    expect(fs.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('reports'), { recursive: true });
    expect(PDFDocument).toHaveBeenCalled();
    expect(DateUtils.formatDate).toHaveBeenCalled();
  });

  test('generateReport falls back to weekly and monthly content branches', async () => {
    const stream = createStream();
    fs.existsSync.mockReturnValue(true);
    fs.createWriteStream.mockReturnValueOnce(stream);
    fs.statSync.mockReturnValueOnce({ size: 99 });
    jest.spyOn(Date, 'now').mockReturnValue(1700000000001);

    const weeklyPromise = PDFService.generateReport(
      {
        period: '2026-W15',
        totalRoutes: 9,
        totalDistance: 120,
        containersCollected: 33,
        criticalContainers: 4,
        costSaved: 500,
        co2Saved: 42,
        distanceReduction: 18,
        treesEquivalent: 7,
        carKmEquivalent: 300,
        recommendations: ['Keep optimizing']
      },
      'weekly'
    );
    await Promise.resolve();
    stream.emit('finish');
    await expect(weeklyPromise).resolves.toEqual(expect.objectContaining({ fileName: 'report_weekly_1700000000001.pdf' }));

    const monthlyStream = createStream();
    fs.createWriteStream.mockReturnValueOnce(monthlyStream);
    fs.statSync.mockReturnValueOnce({ size: 101 });
    jest.spyOn(Date, 'now').mockReturnValue(1700000000002);

    const monthlyPromise = PDFService.generateReport(
      {
        period: '2026-04',
        totalRoutes: 20,
        totalDistance: 340,
        distanceReduction: 21,
        overflowRate: 1.2,
        co2Reduction: 19,
        recommendations: ['Review routes']
      },
      'monthly'
    );
    await Promise.resolve();
    monthlyStream.emit('finish');
    await expect(monthlyPromise).resolves.toEqual(expect.objectContaining({ fileName: 'report_monthly_1700000000002.pdf' }));
  });

  test('generateEnvironmentalReport and generateRoutesPerformanceReport resolve with chart data', async () => {
    mockChartService.generateBarChart.mockResolvedValue(Buffer.from('bar'));
    mockChartService.generateLineChart.mockResolvedValue(Buffer.from('line'));

    const envStream = createStream();
    fs.existsSync.mockReturnValue(true);
    fs.createWriteStream.mockReturnValueOnce(envStream);
    fs.statSync.mockImplementation(() => ({ size: 444 }));
    jest.spyOn(Date, 'now').mockReturnValue(1700000000003);

    const envPromise = PDFService.generateEnvironmentalReport(
      {
        period: 'week',
        environmental: {
          co2: { saved: 10, reductionPct: 12, equivalents: { trees: 2, carKm: 5 } },
          fuel: { saved: 7 },
          costs: { fuel: 3, labor: 4, maintenance: 5 },
          distance: { planned: 100, actual: 90, saved: 10, reductionPct: 10 }
        },
        evolution: [{ date: '2026-04-01', co2_saved: 2 }],
        recommendations: ['A', 'B']
      },
      'week'
    );

    await Promise.resolve();
    envStream.emit('finish');
    await expect(envPromise).resolves.toEqual(expect.objectContaining({ fileName: 'environmental_week_1700000000003.pdf' }));

    const routesStream = createStream();
    fs.createWriteStream.mockReturnValueOnce(routesStream);
    fs.statSync.mockImplementation(() => ({ size: 555 }));
    jest.spyOn(Date, 'now').mockReturnValue(1700000000004);

    const routesPromise = PDFService.generateRoutesPerformanceReport(
      {
        period: 'week',
        environmental: { routes: { completed: 7, total: 10 }, containers: { collected: 33 } },
        agents: { totalAgents: 5, averageSuccessRate: 80, completionRate: 90, topPerformer: { prenom: 'Jo', nom: 'Doe', overall_score: 98, completed_routes: 12 } },
        recommendations: ['Use better routing']
      },
      'week'
    );

    await Promise.resolve();
    routesStream.emit('finish');
    await expect(routesPromise).resolves.toEqual(expect.objectContaining({ fileName: 'routes_performance_week_1700000000004.pdf' }));
  });
});


