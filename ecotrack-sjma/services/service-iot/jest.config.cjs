module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/__tests__/unit/**/*.test.js',
    '<rootDir>/__tests__/integration/**/*.test.js',
    '<rootDir>/__tests__/e2e/**/*.e2e.test.js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/index.js',
    '!src/**/*.config.js'
  ],
  coverageReporters: ['html', 'text', 'lcov', 'json'],
  testTimeout: 10000
};
