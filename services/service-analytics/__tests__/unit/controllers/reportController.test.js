jest.mock('../../../src/services/pdfService', () => ({
  generateReport: jest.fn(),
  generateEnvironmentalReport: jest.fn(),
  generateRoutesPerformanceReport: jest.fn()
}));

jest.mock('../../../src/services/excelService', () => ({
  generateReport: jest.fn(),
  generateEnvironmentalReport: jest.fn(),
  generateRoutesPerformanceReport: jest.fn()
}));

const mockSendReport = jest.fn();

jest.mock('../../../src/services/emailService', () =>
  jest.fn().mockImplementation(() => ({
    sendReport: mockSendReport
  }))
);

jest.mock('../../../src/services/dashboardService', () => ({
  getDashboardData: jest.fn(),
  generateInsights: jest.fn()
}));

jest.mock('../../../src/services/performanceService', () => ({
  getCompleteDashboard: jest.fn()
}));

jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

jest.mock('fs', () => ({
  existsSync: jest.fn()
}));

const PDFService = require('../../../src/services/pdfService');
const ExcelService = require('../../../src/services/excelService');
const EmailService = require('../../../src/services/emailService');
const DashboardService = require('../../../src/services/dashboardService');
const PerformanceService = require('../../../src/services/performanceService');
const fs = require('fs');
const ReportController = require('../../../src/controllers/reportController');

function createRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    download: jest.fn()
  };
}

function mockReportDependencies() {
  DashboardService.getDashboardData.mockResolvedValue({
    realTime: {
      open_reports: 3,
      critical_containers: 2,
      reports_today: 7
    },
    heatmap: [{ zone: 'A' }],
    critical: [{ route: 'R1' }],
    global: {
      critical_containers: '2',
      total_containers: '10'
    }
  });

  DashboardService.generateInsights.mockReturnValue(['insight-1']);

  PerformanceService.getCompleteDashboard.mockResolvedValue({
    environmental: {
      routes: { completed: 4, total: 5 },
      containers: { collected: 12 },
      distance: { actual: '45', reductionPct: 18 },
      costs: { total: 123.45, fuel: 50, labor: 40, maintenance: 33.45 },
      co2: {
        saved: 12.34,
        reductionPct: 22,
        equivalents: { trees: 2, carKm: 30 }
      },
      fuel: { saved: 6 }
    },
    agents: { total: 3 },
    period: 'week',
    generatedAt: '2026-04-10T00:00:00.000Z'
  });
}

describe('ReportController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReportDependencies();
  });

  test('generateReport creates a pdf report and emails it', async () => {
    PDFService.generateReport.mockResolvedValueOnce({
      fileName: 'report.pdf',
      url: '/reports/report.pdf',
      size: 2048
    });

    const res = createRes();

    await ReportController.generateReport(
      { body: { format: 'pdf', reportType: 'weekly', email: 'user@example.com' } },
      res
    );

    expect(PDFService.generateReport).toHaveBeenCalledWith(
      expect.objectContaining({
        completedRoutes: 4,
        containersCollected: 12,
        resolvedReports: 3,
        recommendations: ['insight-1']
      }),
      'weekly'
    );
    expect(mockSendReport).toHaveBeenCalledWith(
      { fileName: 'report.pdf', url: '/reports/report.pdf', size: 2048 },
      ['user@example.com'],
      'weekly'
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          format: 'pdf',
          reportType: 'weekly',
          fileName: 'report.pdf',
          emailSent: true
        })
      })
    );
  });

  test('generateReport rejects invalid formats', async () => {
    const res = createRes();

    await ReportController.generateReport(
      { body: { format: 'txt', reportType: 'weekly' } },
      res
    );

    expect(PDFService.generateReport).not.toHaveBeenCalled();
    expect(ExcelService.generateReport).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Invalid format. Use "pdf" or "excel"'
    });
  });

  test('generateReport handles generator failures', async () => {
    PDFService.generateReport.mockRejectedValueOnce(new Error('pdf failure'));

    const res = createRes();

    await ReportController.generateReport(
      { body: { format: 'pdf', reportType: 'weekly' } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Failed to generate report',
        message: 'pdf failure'
      })
    );
  });

  test('downloadReport returns 404 when the file is missing and streams when found', async () => {
    const missingRes = createRes();
    fs.existsSync.mockReturnValueOnce(false);

    await ReportController.downloadReport({ params: { filename: 'missing.pdf' } }, missingRes);

    expect(missingRes.status).toHaveBeenCalledWith(404);
    expect(missingRes.json).toHaveBeenCalledWith({
      success: false,
      error: 'Report not found'
    });

    const downloadRes = createRes();
    fs.existsSync.mockReturnValueOnce(true);

    await ReportController.downloadReport({ params: { filename: 'report.pdf' } }, downloadRes);

    expect(downloadRes.download).toHaveBeenCalledWith(expect.stringContaining('report.pdf'));
  });

  test('generateEnvironmentalReport builds an excel report and emails it', async () => {
    ExcelService.generateEnvironmentalReport.mockResolvedValueOnce({
      fileName: 'environmental.xlsx',
      url: '/reports/environmental.xlsx',
      size: 1024
    });

    const res = createRes();

    await ReportController.generateEnvironmentalReport(
      { body: { format: 'excel', period: 'month', email: 'ops@example.com' } },
      res
    );

    expect(ExcelService.generateEnvironmentalReport).toHaveBeenCalledWith(
      expect.objectContaining({
        environmental: expect.any(Object),
        recommendations: expect.arrayContaining([
          'Optimisation des tournées recommandée'
        ])
      }),
      'month'
    );
    expect(mockSendReport).toHaveBeenCalledWith(
      { fileName: 'environmental.xlsx', url: '/reports/environmental.xlsx', size: 1024 },
      ['ops@example.com'],
      'month_environmental'
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          reportType: 'environmental',
          format: 'excel',
          emailSent: true
        })
      })
    );
  });

  test('generateRoutesPerformanceReport builds a pdf report without email', async () => {
    PDFService.generateRoutesPerformanceReport.mockResolvedValueOnce({
      fileName: 'routes.pdf',
      url: '/reports/routes.pdf',
      size: 4096
    });

    const res = createRes();

    await ReportController.generateRoutesPerformanceReport(
      { body: { format: 'pdf', period: 'week' } },
      res
    );

    expect(PDFService.generateRoutesPerformanceReport).toHaveBeenCalledWith(
      expect.objectContaining({
        agents: expect.any(Object),
        environmental: expect.any(Object)
      }),
      'week'
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          reportType: 'routes_performance',
          format: 'pdf',
          emailSent: false
        })
      })
    );
  });
});


