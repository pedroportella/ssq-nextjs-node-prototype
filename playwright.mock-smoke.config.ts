import { defineConfig } from "@playwright/test";

const mockEnv = {
  NEXT_TELEMETRY_DISABLED: "1",
  SSQ_FRONTEND_DATA_SOURCE: "mock"
};

export default defineConfig({
  expect: {
    timeout: 10_000
  },
  testDir: "tests/mock-smoke",
  timeout: 30_000,
  use: {
    trace: "retain-on-failure"
  },
  webServer: [
    {
      command: "pnpm --filter @ssq/dashboard dev",
      env: mockEnv,
      reuseExistingServer: true,
      timeout: 120_000,
      url: "http://localhost:3000"
    },
    {
      command: "pnpm --filter @ssq/seniors-card dev",
      env: mockEnv,
      reuseExistingServer: true,
      timeout: 120_000,
      url: "http://localhost:3001"
    },
    {
      command: "pnpm --filter @ssq/rental-security-subsidy dev",
      env: mockEnv,
      reuseExistingServer: true,
      timeout: 120_000,
      url: "http://localhost:3002"
    }
  ],
  workers: 1
});
