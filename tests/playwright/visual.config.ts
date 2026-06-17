import { defineConfig } from "@playwright/test";
import { allMockWebServers } from "./mockWebServers";

export default defineConfig({
  expect: {
    timeout: 10_000
  },
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}{ext}",
  testDir: "../visual",
  timeout: 60_000,
  use: {
    trace: "retain-on-failure"
  },
  webServer: allMockWebServers,
  workers: 1
});
