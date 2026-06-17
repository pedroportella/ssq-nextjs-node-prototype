import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  expect: {
    timeout: 10_000
  },
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: false,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  retries: process.env.CI ? 1 : 0,
  testDir: "tests/e2e",
  timeout: 60_000,
  use: {
    baseURL: process.env.SSQ_E2E_DASHBOARD_URL ?? "http://127.0.0.1:3000",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    video: "retain-on-failure"
  },
  workers: 1
});
