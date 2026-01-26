import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    testTimeout: 30000, // 30 seconds for integration tests
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'dist/'],
    },
    setupFiles: ['./tests/setup.ts'],
    // Run tests sequentially to avoid timer conflicts
    sequence: {
      concurrent: false,
    },
  },
});
