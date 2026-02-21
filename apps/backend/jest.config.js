module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js'],
    collectCoverageFrom: ['src/**/*.js'],
    coverageThreshold: {
      global: {
        branches: 60,
        functions: 60,
        lines: 60,
      },
    },
  };