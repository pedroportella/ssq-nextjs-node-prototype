import { describe, expect, it } from "vitest";

import { DEFAULT_DEMO_CUSTOMER_EMAIL, resolveDemoIdentity } from "./demoIdentity.js";

describe("resolveDemoIdentity", () => {
  it("maps absent demo headers to the default citizen identity contract", () => {
    expect(resolveDemoIdentity({})).toEqual({
      assuranceLevel: "DEMO_LOW_ASSURANCE",
      displayName: "demo.customer",
      email: DEFAULT_DEMO_CUSTOMER_EMAIL,
      role: "Citizen",
      roles: ["Citizen"],
      source: "DEMO_HEADER",
      subject: DEFAULT_DEMO_CUSTOMER_EMAIL,
      userId: `demo:citizen:${DEFAULT_DEMO_CUSTOMER_EMAIL}`
    });
  });

  it("maps reviewer headers to the same resolved identity shape", () => {
    expect(resolveDemoIdentity({
      roleHeader: "ServiceOfficer",
      subjectHeader: "officer@example.test"
    })).toEqual({
      assuranceLevel: "DEMO_LOW_ASSURANCE",
      displayName: "ServiceOfficer officer@example.test",
      email: "officer@example.test",
      role: "ServiceOfficer",
      roles: ["ServiceOfficer"],
      source: "DEMO_HEADER",
      subject: "officer@example.test",
      userId: "demo:serviceofficer:officer@example.test"
    });
  });

  it("falls back to citizen for unknown roles while preserving the subject", () => {
    expect(resolveDemoIdentity({
      legacyCustomerEmailHeader: "other.customer@example.test",
      roleHeader: "Unknown"
    })).toMatchObject({
      role: "Citizen",
      roles: ["Citizen"],
      subject: "other.customer@example.test"
    });
  });
});
