import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.property.ts'],
    testTimeout: 30000,
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      'obsidian': path.resolve(__dirname, 'tests/__mocks__/obsidian.ts'),
    },
  },
});
