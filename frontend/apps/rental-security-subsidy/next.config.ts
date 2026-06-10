import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ["@ssq/services", "@ssq/ui-library", "@ssq/ui-tokens", "@ssq/utils"]
};

export default nextConfig;
