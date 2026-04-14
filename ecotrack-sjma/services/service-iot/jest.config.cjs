module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/__tests__/**/*.test.js',
    '<rootDir>/__tests__/**/*.e2e.test.js',
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/index.js',
    '!src/**/*.config.js'
  ],
  coverageReporters: ['html', 'text', 'lcov', 'json'],
  testTimeout: 10000,
  passWithNoTests: true
};
