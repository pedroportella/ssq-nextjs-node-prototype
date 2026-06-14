import { defineConfig } from "@playwright/test";
import { selectedMockSmokeAppNames } from "./tests/mock-smoke/app-selection";

const mockEnv = {
  NEXT_TELEMETRY_DISABLED: "1",
  SSQ_FRONTEND_DATA_SOURCE: "mock"
};

const webServers = {
  dashboard: {
    command: "pnpm --filter @ssq/dashboard dev",
    env: mockEnv,
    reuseExistingServer: true,
    timeout: 120_000,
    url: "http://localhost:3000"
  },
  "rental-security-subsidy": {
    command: "pnpm --filter @ssq/rental-security-subsidy dev",
    env: mockEnv,
    reuseExistingServer: true,
    timeout: 120_000,
    url: "http://localhost:3002"
  },
  "seniors-card": {
    command: "pnpm --filter @ssq/seniors-card dev",
    env: mockEnv,
    reuseExistingServer: true,
    timeout: 120_000,
    url: "http://localhost:3001"
  }
} as const;

export default defineConfig({
  expect: {
    timeout: 10_000
  },
  testDir: "tests/mock-smoke",
  timeout: 30_000,
  use: {
    trace: "retain-on-failure"
  },
  webServer: selectedMockSmokeAppNames.map((appName) => webServers[appName]),
  workers: 1
});
