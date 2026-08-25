import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3311",
    headless: true,
  },
  webServer: process.env.CI
    ? undefined
    : {
        command: "npm run start -- -p 3311",
        url: "http://localhost:3311",
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
