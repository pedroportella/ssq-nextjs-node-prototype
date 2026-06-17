import { defineConfig } from "vitest/config";

export default defineConfig({
  css: {
    preprocessorOptions: {
      sass: { api: "modern" },
      scss: { api: "modern" }
    }
  },
  test: {
    environment: "happy-dom",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["src/test/setup.ts"]
  }
});
