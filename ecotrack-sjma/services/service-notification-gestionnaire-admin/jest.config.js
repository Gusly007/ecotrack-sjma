module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/__tests__/unit/**/*.test.js',
    '<rootDir>/__tests__/integration/**/*.test.js'
  ],
  collectCoverageFrom: ['src/**/*.js'],
  coverageDirectory: 'coverage'
};
