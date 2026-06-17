import { defineConfig, devices } from "@playwright/test";
import { selectedMockSmokeAppNames } from "../mock-smoke/app-selection";
import { mockWebServersByApp } from "./mockWebServers";

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
  testDir: "../scenarios",
  timeout: 60_000,
  use: {
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure"
  },
  webServer: selectedMockSmokeAppNames.map((appName) => mockWebServersByApp[appName]),
  workers: 1
});
