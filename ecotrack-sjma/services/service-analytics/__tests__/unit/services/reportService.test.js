jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

jest.mock('../../../src/services/dashboardService', () => ({
  getDashboardData: jest.fn()
}));

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

jest.mock('../../../src/services/emailService', () => {
  return jest.fn().mockImplementation(() => ({
    sendReport: jest.fn()
  }));
});

const DashboardService = require('../../../src/services/dashboardService');
const PDFService = require('../../../src/services/pdfService');
const ExcelService = require('../../../src/services/excelService');
const EmailService = require('../../../src/services/emailService');
const ReportService = require('../../../src/services/reportService');

describe('ReportService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.REPORT_DAILY_RECIPIENTS = 'a@test.com,b@test.com';
    process.env.REPORT_WEEKLY_RECIPIENTS = '';
    process.env.REPORT_MONTHLY_RECIPIENTS = 'm@test.com';
  });

  test('generateAndSendReport builds report and sends emails for pdf', async () => {
    DashboardService.getDashboardData.mockResolvedValueOnce({ realTime: { critical_containers: 1 }, global: {}, heatmap: [], critical: [], evolution: { data: [] } });
    PDFService.generateReport.mockResolvedValueOnce({ fileName: 'r.pdf', url: '/r.pdf', size: 10 });
    const service = new ReportService();

    const report = await service.generateAndSendReport('weekly', 'pdf');

    expect(DashboardService.getDashboardData).toHaveBeenCalledWith('week');
    expect(PDFService.generateReport).toHaveBeenCalled();
    expect(service.emailService.sendReport).not.toHaveBeenCalled();
    expect(report.fileName).toBe('r.pdf');
  });

  test('generateAndSendReport uses excel and sends recipients', async () => {
    DashboardService.getDashboardData.mockResolvedValueOnce({ realTime: {}, global: {}, heatmap: [], critical: [], evolution: { data: [] } });
    ExcelService.generateReport.mockResolvedValueOnce({ fileName: 'r.xlsx', url: '/r.xlsx', size: 20 });
    const service = new ReportService();

    const report = await service.generateAndSendReport('monthly', 'excel');

    expect(DashboardService.getDashboardData).toHaveBeenCalledWith('month');
    expect(ExcelService.generateReport).toHaveBeenCalled();
    expect(service.emailService.sendReport).toHaveBeenCalledWith({ fileName: 'r.xlsx', url: '/r.xlsx', size: 20 }, ['m@test.com'], 'monthly');
    expect(report.fileName).toBe('r.xlsx');
  });

  test('_getRecipients filters empty values and falls back to []', () => {
    const service = new ReportService();
    expect(service._getRecipients('daily')).toEqual(['a@test.com', 'b@test.com']);
    expect(service._getRecipients('unknown')).toEqual([]);
  });
});



