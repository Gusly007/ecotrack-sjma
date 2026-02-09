module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/__tests__/setupEnv.js'],
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/**/index.js'],
  testTimeout: 20000
};
