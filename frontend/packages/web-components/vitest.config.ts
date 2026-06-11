import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
    exclude: ["src/browser-harness/**/*.ts"],
    include: ["src/**/*.test.ts"]
  }
});
