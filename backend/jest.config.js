module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.js"],

  // Coverage configuration
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "controllers/**/*.js",
    "middleware/**/*.js",
    "models/**/*.js",
    "routes/**/*.js",
    "services/**/*.js",
    "utils/**/*.js",
    "jobs/**/*.js",
    "!**/node_modules/**",
    "!**/__tests__/**",
    "!**/config/**",
  ],

  // Coverage thresholds - fail if below these values
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
    // Stricter thresholds for critical payment code
    "controllers/payment.controller.js": {
      branches: 75,
      functions: 80,
      lines: 85,
      statements: 85,
    },
  },

  // Multiple coverage reporters for different use cases
  coverageReporters: [
    "text", // Console output
    "text-summary", // Summary in console
    "lcov", // For CI/CD integration (SonarQube, Codecov)
    "html", // Visual HTML report
    "json-summary", // Machine-readable summary
    "clover", // XML format for Jenkins
  ],

  // Setup and configuration
  setupFilesAfterEnv: ["./__tests__/setup.js"],
  testTimeout: 30000,
  verbose: true,

  // Error handling
  errorOnDeprecated: true,

  // Performance
  maxWorkers: "50%",

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Fail fast on first error (useful for CI)
  bail: process.env.CI ? 1 : 0,

  // Module paths for easier imports in tests
  moduleDirectories: ["node_modules", "<rootDir>"],

  // Transform ignore patterns
  transformIgnorePatterns: ["/node_modules/"],
};
