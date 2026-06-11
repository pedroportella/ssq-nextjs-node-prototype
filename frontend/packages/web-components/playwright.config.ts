import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./src/browser-harness",
  testMatch: "**/*.browser.test.ts",
  use: {
    baseURL: "http://127.0.0.1:4180",
    ...devices["Desktop Chrome"]
  },
  webServer: {
    command: "pnpm exec vite --host 127.0.0.1 --port 4180 src/browser-harness",
    reuseExistingServer: true,
    url: "http://127.0.0.1:4180"
  }
});
