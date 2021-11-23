/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

module.exports = {
  clearMocks: true,
  collectCoverage: true,
  coverageReporters: [
    "text"
  ],
  coveragePathIgnorePatterns: [
    "/node_modules/"
  ],
  coverageProvider: "v8",
  moduleDirectories: [
    "node_modules"
  ],
  moduleFileExtensions: [
    "js",
    "ts"
  ],
  roots: [
    "<rootDir>/tests"
  ],
  testMatch: [
    "**/*.test.ts"
  ]
};