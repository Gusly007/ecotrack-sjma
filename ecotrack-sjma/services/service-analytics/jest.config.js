module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/__tests__/setup.js'],
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js'
  ],
  coveragePathIgnorePatterns: ['/node_modules/'],
  verbose: true,
  transformIgnorePatterns: [
    'node_modules/(?!(pino|pino-pretty)/)'
  ]
};