import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
    // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
    dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jest-environment-jsdom',
    // Browser E2E specs run separately via Playwright (`npm run test:e2e`).
    // Keep Jest from collecting them as jsdom unit tests.
    testPathIgnorePatterns: ['<rootDir>/e2e/'],
    // The standalone build copies package.json and source files. Keep generated
    // exports out of Jest's module map so a production build cannot shadow tests.
    modulePathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/out/'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(customJestConfig)
