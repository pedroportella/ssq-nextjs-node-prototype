import { describe, expect, it } from "vitest";

import { webComponentPackageStatus } from "./index";

describe("webComponentPackageStatus", () => {
  it("exposes the package readiness placeholder", () => {
    expect(webComponentPackageStatus.status).toBe("ready-for-components");
  });
});
