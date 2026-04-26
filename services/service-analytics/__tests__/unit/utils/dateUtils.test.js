describe('DateUtils', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.doMock('date-fns', () => ({
      startOfDay: jest.fn(() => 'start-day'),
      endOfDay: jest.fn(() => 'end-day'),
      startOfWeek: jest.fn(() => 'start-week'),
      endOfWeek: jest.fn(() => 'end-week'),
      startOfMonth: jest.fn(() => 'start-month'),
      endOfMonth: jest.fn(() => 'end-month'),
      format: jest.fn((value, formatStr) => `formatted:${formatStr}`)
    }));
    jest.doMock('date-fns/locale', () => ({ fr: { code: 'fr' } }));
  });

  afterEach(() => {
    jest.dontMock('date-fns');
    jest.dontMock('date-fns/locale');
  });

  test('getPeriodDates covers day, week, month and default branches', () => {
    const DateUtils = require('../../../src/utils/dateUtils');
    const dateFns = require('date-fns');

    expect(DateUtils.getPeriodDates('day')).toEqual({ start: 'formatted:yyyy-MM-dd', end: 'formatted:yyyy-MM-dd' });
    expect(dateFns.startOfDay).toHaveBeenCalled();
    expect(dateFns.endOfDay).toHaveBeenCalled();

    expect(DateUtils.getPeriodDates('week')).toEqual({ start: 'formatted:yyyy-MM-dd', end: 'formatted:yyyy-MM-dd' });
    expect(dateFns.startOfWeek).toHaveBeenCalledWith(expect.any(Date), { locale: { code: 'fr' } });
    expect(dateFns.endOfWeek).toHaveBeenCalledWith(expect.any(Date), { locale: { code: 'fr' } });

    expect(DateUtils.getPeriodDates('month')).toEqual({ start: 'formatted:yyyy-MM-dd', end: 'formatted:yyyy-MM-dd' });
    expect(dateFns.startOfMonth).toHaveBeenCalledWith(expect.any(Date));
    expect(dateFns.endOfMonth).toHaveBeenCalledWith(expect.any(Date));

    expect(DateUtils.getPeriodDates('unknown')).toEqual({ start: 'formatted:yyyy-MM-dd', end: 'formatted:yyyy-MM-dd' });
  });

  test('formatDate uses the provided format string and default format', () => {
    const DateUtils = require('../../../src/utils/dateUtils');
    const dateFns = require('date-fns');

    expect(DateUtils.formatDate('2026-04-10')).toBe('formatted:dd/MM/yyyy');
    expect(DateUtils.formatDate('2026-04-10', 'yyyy-MM')).toBe('formatted:yyyy-MM');
    expect(dateFns.format).toHaveBeenCalledWith(expect.any(Date), 'dd/MM/yyyy', expect.objectContaining({ locale: { code: 'fr' } }));
  });
});



