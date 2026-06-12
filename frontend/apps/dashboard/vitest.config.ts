import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "server-only": new URL("./src/tests/server-only.ts", import.meta.url).pathname
    }
  },
  test: {
    environment: "node",
    globals: true,
    include: ["src/tests/**/*.test.ts", "src/tests/**/*.test.tsx"]
  }
});
