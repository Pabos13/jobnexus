/**
 * Testing Configuration
 * Jest setup for unit and integration tests
 */

module.exports = {
    testEnvironment: 'jsdom',
    roots: ['<rootDir>'],
    testMatch: ['**/__tests__/**/*.test.js'],
    collectCoverageFrom: [
        'services/**/*.js',
        'app.js',
        '!**/*.test.js'
    ],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
    }
};
