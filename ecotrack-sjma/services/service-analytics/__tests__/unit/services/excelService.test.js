jest.mock('exceljs', () => {
  const createSheet = () => ({
    mergeCells: jest.fn(),
    getCell: jest.fn(() => ({
      font: undefined,
      alignment: undefined,
      value: undefined
    })),
    getRow: jest.fn((rowNumber) => ({
      values: undefined,
      font: undefined,
      fill: undefined,
      height: undefined
    })),
    getColumn: jest.fn(() => ({ width: undefined })),
    addRow: jest.fn(),
    columns: []
  });

  const Workbook = jest.fn().mockImplementation(() => {
    const sheets = [];
    return {
      creator: undefined,
      created: undefined,
      _sheets: sheets,
      addWorksheet: jest.fn((name) => {
        const sheet = createSheet();
        sheets.push({ name, sheet });
        return sheet;
      }),
      xlsx: { writeFile: jest.fn().mockResolvedValue(undefined) }
    };
  });

  return { Workbook };
});

jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  statSync: jest.fn()
}));

const ExcelJS = require('exceljs');
const fs = require('fs');
const ExcelService = require('../../../src/services/excelService');

describe('ExcelService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, REPORTS_DIR: 'D:/reports' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('_addSummarySheet and _addKPIsSheet populate workbook sections', async () => {
    const workbook = new ExcelJS.Workbook();

    await ExcelService._addSummarySheet(workbook, {
      period: 'week',
      totalRoutes: 8,
      totalDistance: 120,
      overflowRate: 1.5,
      costSaved: 55,
      co2Saved: 12
    });
    await ExcelService._addKPIsSheet(workbook, {
      active_containers: { current: 12, unit: 'u', variation: 5 },
      total_routes: 10
    });

    expect(workbook.addWorksheet).toHaveBeenCalledWith('Résumé', expect.any(Object));
    expect(workbook.addWorksheet).toHaveBeenCalledWith('KPIs');
  });

  test('_addZonesSheet and _addRoutesSheet write expected rows', async () => {
    const workbook = new ExcelJS.Workbook();

    await ExcelService._addZonesSheet(workbook, [
      { name: 'Zone A', containersCount: 7, avgFillLevel: 64, criticalCount: 2, reportsCount: 1 }
    ]);
    await ExcelService._addRoutesSheet(workbook, [
      { code: 'R1', date: '2026-04-01', agentName: 'Alex', distance: 12, duration: 30, status: 'done' }
    ]);

    expect(workbook.addWorksheet).toHaveBeenCalledWith('Zones');
    expect(workbook.addWorksheet).toHaveBeenCalledWith('Tournées');
  });

  test('generateReport creates files and includes optional sheets', async () => {
    fs.existsSync.mockReturnValueOnce(false);
    fs.statSync.mockReturnValueOnce({ size: 2468 });
    jest.spyOn(Date, 'now').mockReturnValue(1700000000100);

    const result = await ExcelService.generateReport(
      {
        period: 'week',
        totalRoutes: 11,
        totalDistance: 250,
        overflowRate: 2,
        costSaved: 100,
        co2Saved: 80,
        kpis: { load_factor: { current: 88, unit: '%', variation: 3 } },
        zones: [{ name: 'North', containersCount: 5, avgFillLevel: 60, criticalCount: 1, reportsCount: 2 }],
        routes: [{ code: 'R-9', date: '2026-04-01', agentName: 'Camille', distance: 22, duration: 41, status: 'done' }]
      },
      'weekly'
    );

    expect(fs.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('reports'), { recursive: true });
    expect(ExcelJS.Workbook).toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        fileName: 'report_excel_weekly_1700000000100.xlsx',
        url: '/reports/report_excel_weekly_1700000000100.xlsx',
        size: 2468
      })
    );
  });

  test('generateEnvironmentalReport and generateRoutesPerformanceReport write output files', async () => {
    fs.existsSync.mockReturnValue(true);
    fs.statSync.mockReturnValueOnce({ size: 111 }).mockReturnValueOnce({ size: 222 });
    jest.spyOn(Date, 'now').mockReturnValueOnce(1700000000200).mockReturnValueOnce(1700000000201);

    const envResult = await ExcelService.generateEnvironmentalReport(
      {
        period: 'week',
        environmental: {
          co2: { saved: 12, reductionPct: 8, equivalents: { trees: 2, carKm: 4 } },
          fuel: { saved: 9 },
          costs: { total: 100, fuel: 30, labor: 40, maintenance: 30 }
        },
        zones: [{ zone_name: 'Zone A', containers_count: 3, avg_fill_level: 54, status: 'ok' }]
      },
      'week'
    );

    const routesResult = await ExcelService.generateRoutesPerformanceReport(
      {
        period: 'week',
        environmental: { routes: { completed: 6, total: 8 }, containers: { collected: 20 } },
        agents: { totalAgents: 4, averageSuccessRate: 90, completionRate: 95, ranking: [{ rank: 1, name: 'A', completedRoutes: 5, overallScore: 99, collectionRate: 100 }] }
      },
      'week'
    );

    expect(envResult).toEqual(expect.objectContaining({ fileName: 'environmental_week_1700000000200.xlsx', size: 111 }));
    expect(routesResult).toEqual(expect.objectContaining({ fileName: 'routes_performance_week_1700000000201.xlsx', size: 222 }));
  });
});


