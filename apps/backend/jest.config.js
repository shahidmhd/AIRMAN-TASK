module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js'],
    testTimeout: 30000,
    setupFiles: ['./tests/setup.js'],
    collectCoverageFrom: ['src/**/*.js'],
    coverageThreshold: {
      global: {
        branches: 30,
        functions: 15,
        lines: 40,
      },
    },
  };
