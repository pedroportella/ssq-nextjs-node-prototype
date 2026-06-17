import { defineConfig } from "@playwright/test";
import { allMockWebServers, mockWebServersByApp } from "./mockWebServers";

const webServers = process.env.SSQ_VISUAL_APP === "dashboard"
  ? [mockWebServersByApp.dashboard]
  : allMockWebServers;

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
  webServer: webServers,
  workers: 1
});
