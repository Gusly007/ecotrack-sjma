module.exports = {
  PERIODS: {
    DAY: 'day',
    WEEK: 'week',
    MONTH: 'month',
    QUARTER: 'quarter',
    YEAR: 'year'
  },

  METRICS: {
    CONTAINERS_TOTAL: 'containers_total',
    CONTAINERS_CRITICAL: 'containers_critical',
    ROUTES_COMPLETED: 'routes_completed',
    OVERFLOW_RATE: 'overflow_rate',
    DISTANCE_SAVED: 'distance_saved',
    CO2_SAVED: 'co2_saved'
  },

  THRESHOLDS: {
    CRITICAL_FILL_LEVEL: 90,
    WARNING_FILL_LEVEL: 80,
    OVERFLOW_RATE_TARGET: 2,
    DISTANCE_REDUCTION_TARGET: 20
  },

  COLORS: {
    SUCCESS: '#10B981',
    WARNING: '#F59E0B',
    DANGER: '#EF4444',
    INFO: '#3B82F6'
  },

  SERVICE_URLS: {
    USERS_SERVICE: process.env.USERS_SERVICE_URL || 'http://ecotrack-service-users:3002'
  }
};