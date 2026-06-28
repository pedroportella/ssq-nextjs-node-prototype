import type { MockSmokeAppName } from "../mock-smoke/app-selection";

const mockEnv = {
  NEXT_TELEMETRY_DISABLED: "1",
  SSQ_FRONTEND_DATA_SOURCE: "mock"
};

export const mockWebServersByApp = {
  dashboard: {
    command: "pnpm --filter @ssq/dashboard dev",
    env: mockEnv,
    reuseExistingServer: true,
    timeout: 120_000,
    url: "http://localhost:3300"
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
} as const satisfies Record<MockSmokeAppName, {
  command: string;
  env: typeof mockEnv;
  reuseExistingServer: boolean;
  timeout: number;
  url: string;
}>;

export const allMockWebServers = [
  mockWebServersByApp.dashboard,
  mockWebServersByApp["seniors-card"],
  mockWebServersByApp["rental-security-subsidy"]
];
