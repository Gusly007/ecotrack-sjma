const StatsUtils = require('../../../src/utils/statsUtils');

describe('StatsUtils', () => {
  test('calculateMean handles empty and populated arrays', () => {
    expect(StatsUtils.calculateMean()).toBe(0);
    expect(StatsUtils.calculateMean([])).toBe(0);
    expect(StatsUtils.calculateMean([2, 4, 6, 8])).toBe(5);
  });

  test('calculateStandardDeviation handles empty and populated arrays', () => {
    expect(StatsUtils.calculateStandardDeviation()).toBe(0);
    expect(StatsUtils.calculateStandardDeviation([])).toBe(0);
    expect(StatsUtils.calculateStandardDeviation([2, 4, 4, 4, 5, 5, 7, 9])).toBe(2);
  });

  test('calculateMedian handles empty, odd and even arrays', () => {
    expect(StatsUtils.calculateMedian()).toBe(0);
    expect(StatsUtils.calculateMedian([])).toBe(0);
    expect(StatsUtils.calculateMedian([3, 1, 2])).toBe(2);
    expect(StatsUtils.calculateMedian([1, 2, 3, 4])).toBe(2.5);
  });

  test('normalize scales values between 0 and 1', () => {
    expect(StatsUtils.normalize([10, 20, 30])).toEqual([0, 0.5, 1]);
  });

  test('denormalize restores value from normalized scale', () => {
    expect(StatsUtils.denormalize(0.5, 10, 30)).toBe(20);
  });
});
