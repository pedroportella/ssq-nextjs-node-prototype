import { describe, expect, it } from "vitest";

import { resolveFrontendPublicUrlConfig } from "./index";

describe("frontend public URLs", () => {
  it("returns local defaults for frontend-only development", () => {
    expect(resolveFrontendPublicUrlConfig({})).toEqual({
      dashboard: "http://localhost:3000",
      "rental-security-subsidy": "http://localhost:3002",
      "seniors-card": "http://localhost:3001"
    });
  });

  it("normalises configured public app URLs", () => {
    expect(
      resolveFrontendPublicUrlConfig({
        DASHBOARD_PUBLIC_URL: "https://dashboard.example.test/",
        RENTAL_SECURITY_SUBSIDY_PUBLIC_URL: "https://rss.example.test/",
        SENIORS_CARD_PUBLIC_URL: "https://seniors.example.test/"
      })
    ).toEqual({
      dashboard: "https://dashboard.example.test",
      "rental-security-subsidy": "https://rss.example.test",
      "seniors-card": "https://seniors.example.test"
    });
  });
});
