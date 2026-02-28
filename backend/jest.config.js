export default {
  // Test environment
  testEnvironment: 'node',
  
  // File extensions to look for
  extensionsToTreatAsEsm: ['.js'],
  
  // Transform files with Babel
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  
  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js',
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/config/**',
    '!src/middleware/**',
  ],
  
  // Coverage directory
  coverageDirectory: 'coverage',
  
  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Reset modules between tests
  resetModules: true,
  
  // Verbose output
  verbose: true,
  
  // Test timeout
  testTimeout: 10000,
  
  // Module name mapping for ES modules
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Additional Jest options for Docker compatibility
  testRunner: 'jest-circus/runner',
  
  // Disable coverage collection in CI/Docker by default
  collectCoverage: false,
  
  // Force exit after tests complete
  forceExit: true,
  
  // Detect open handles
  detectOpenHandles: true,
  
  // Maximum number of workers
  maxWorkers: 1,
}; 