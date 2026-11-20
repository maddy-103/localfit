import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        // LocalStorage needs a real origin; about:blank is opaque.
        url: 'http://localhost/',
      },
    },
    globals: true,
    // Playwright specs live in tests/ and must not be collected by Vitest.
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/**/*.spec.ts'],
    setupFiles: './src/test/setup.ts',
    css: true,
    restoreMocks: true,
  },
});
