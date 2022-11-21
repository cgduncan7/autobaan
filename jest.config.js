export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
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