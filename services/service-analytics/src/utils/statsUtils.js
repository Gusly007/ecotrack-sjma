class StatsUtils {
  static calculateMean(values) {
    if (!values || values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  static calculateStandardDeviation(values) {
    if (!values || values.length === 0) return 0;
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = this.calculateMean(squaredDiffs);
    return Math.sqrt(variance);
  }

  static calculateMedian(values) {
    if (!values || values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
  }

  static normalize(values) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    return values.map(v => (v - min) / (max - min));
  }

  static denormalize(normalized, min, max) {
    return normalized * (max - min) + min;
  }
}

module.exports = StatsUtils;