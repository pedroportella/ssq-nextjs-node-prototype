import { describe, expect, it } from "vitest";

import { getDashboardShellData, getRentalSecuritySubsidyShellData, getSeniorsCardShellData } from "./index";

describe("server app services", () => {
  it("returns dashboard shell data", async () => {
    await expect(getDashboardShellData()).resolves.toMatchObject({
      app: {
        key: "dashboard",
        status: "UP"
      },
      backendBoundary: "server-only"
    });
  });

  it("returns transaction app shell data", async () => {
    await expect(getSeniorsCardShellData()).resolves.toMatchObject({
      app: {
        key: "seniors-card"
      }
    });
    await expect(getRentalSecuritySubsidyShellData()).resolves.toMatchObject({
      app: {
        key: "rental-security-subsidy"
      }
    });
  });
});
