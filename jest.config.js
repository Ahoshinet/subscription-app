/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  clearMocks: true,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: [
    // decode-uri-component is pinned to an ESM-only release (0.5.0) via the pnpm-workspace.yaml
    // audit override, so it needs to be transformed like the RN packages below.
    'node_modules/(?!(\\.pnpm|((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|expo-router|@react-navigation/.*|react-native-svg|decode-uri-component)))',
  ],
  collectCoverageFrom: [
    'lib/**/*.ts',
    'store/**/*.ts',
    '!**/*.test.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text-summary', 'lcov'],
  coverageThreshold: {
    global: {
      statements: 76,
      branches: 64,
      functions: 74,
      lines: 79,
    },
  },
};
