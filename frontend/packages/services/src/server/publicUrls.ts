import "server-only";

import type { PrototypeAppKey } from "../index";

export type FrontendPublicUrlConfig = Record<PrototypeAppKey, string>;

const defaultPublicUrls: FrontendPublicUrlConfig = {
  dashboard: "http://localhost:3000",
  "rental-security-subsidy": "http://localhost:3002",
  "seniors-card": "http://localhost:3001"
};

function normalisePublicUrl(url: string): string {
  return url.replace(/\/$/, "");
}

export function resolveFrontendPublicUrlConfig(env: NodeJS.ProcessEnv = process.env): FrontendPublicUrlConfig {
  return {
    dashboard: normalisePublicUrl(env.DASHBOARD_PUBLIC_URL ?? defaultPublicUrls.dashboard),
    "rental-security-subsidy": normalisePublicUrl(
      env.RENTAL_SECURITY_SUBSIDY_PUBLIC_URL ?? defaultPublicUrls["rental-security-subsidy"]
    ),
    "seniors-card": normalisePublicUrl(env.SENIORS_CARD_PUBLIC_URL ?? defaultPublicUrls["seniors-card"])
  };
}
