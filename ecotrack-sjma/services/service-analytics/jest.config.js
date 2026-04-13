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
  ],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/coverage/junit',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathAsClassName: true
      }
    ]
  ]
};