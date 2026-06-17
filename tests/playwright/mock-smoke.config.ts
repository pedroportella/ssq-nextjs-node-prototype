import { defineConfig, devices } from "@playwright/test";
import { selectedMockSmokeAppNames } from "../mock-smoke/app-selection";
import { mockWebServersByApp } from "./mockWebServers";

export default defineConfig({
  expect: {
    timeout: 10_000
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  testDir: "../mock-smoke",
  timeout: 30_000,
  use: {
    trace: "retain-on-failure"
  },
  webServer: selectedMockSmokeAppNames.map((appName) => mockWebServersByApp[appName]),
  workers: 1
});
