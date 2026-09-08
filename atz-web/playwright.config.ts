import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3311);
const baseURL = process.env.BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  // A committed `.only` should fail CI rather than silently skip the suite.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [["html", { open: "never" }], ["github"], ["list"]]
    : [["html", { open: "never" }], ["list"]],
  use: {
    baseURL,
    headless: true,
    // Artefacts only for failures — enough to diagnose without bloating CI.
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    // Mobile coverage runs on Chromium rather than WebKit. The suite used to
    // declare an `iPhone 13` project, but CI only ever installed Chromium, so
    // those 40 tests never ran there — and locally 14 of them failed on
    // WebKit-for-Windows quirks (Tab focus, menu tap dispatch) rather than on
    // real defects: the same journeys pass under this project. A mobile suite
    // that actually runs in CI is worth more than one that does not.
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npm run start -- -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
