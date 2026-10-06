/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ["<rootDir>/services/**/*.spec.ts", "<rootDir>/services/**/*.test.ts"],
  modulePathIgnorePatterns: ["<rootDir>/client/"],
  setupFiles: ["<rootDir>/jest.setup.ts"],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          esModuleInterop: true
        }
      }
    ]
  },
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/api/spotify\\.controller\\.ts$"
  ]
};
//DONT TOUCH THIS, ONLY ME AND GOD KNOW HOW THIS WORKS