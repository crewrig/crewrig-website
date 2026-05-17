import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4321/crewrig-website/',
  },
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4321/crewrig-website/',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
