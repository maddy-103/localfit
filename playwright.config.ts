import { defineConfig } from '@playwright/test';

/** Keep Playwright away from Vitest's *.test.ts files under src/. */
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  reporter: 'list',
  use: {
    channel: 'chrome',
    baseURL: process.env.QA_BASE ?? 'http://127.0.0.1:5175',
  },
});
