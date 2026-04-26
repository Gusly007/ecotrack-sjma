module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/__tests__/**/*.test.js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/index.js',
    '!src/**/*.config.js',
    '!src/db/**'
  ],
  coverageReporters: ['html', 'text', 'lcov', 'json'],
  testTimeout: 10000,
  passWithNoTests: true,
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'EcoTrack - service-routes Test Report',
      outputPath: 'test-results/test-report.html',
      shortFilePaths: true
    }]
  ]
};
