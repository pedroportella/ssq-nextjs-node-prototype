import type { NextConfig } from "next";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: repoRoot,
  poweredByHeader: false,
  transpilePackages: ["@ssq/services", "@ssq/ui-library", "@ssq/ui-tokens", "@ssq/utils"]
};

export default nextConfig;
