module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/__tests__/setup.js'],
  testMatch: [
    '<rootDir>/__tests__/unit/**/*.test.js',
    '<rootDir>/__tests__/integration/**/*.test.js'
  ],
  collectCoverageFrom: ['src/**/*.js'],
  coverageDirectory: 'coverage'
};
