import { describe, expect, it } from "vitest";

import { AuthorizationPolicyService } from "./authorizationPolicy.js";
import { resolveDemoIdentity } from "./demoIdentity.js";

const policy = new AuthorizationPolicyService();

describe("AuthorizationPolicyService", () => {
  it("allows citizens to manage citizen surfaces but not reviewer queues", () => {
    const citizen = resolveDemoIdentity({});

    expect(policy.decide(citizen, "citizen.draft.manage")).toMatchObject({
      ok: true,
      action: "citizen.draft.manage"
    });
    expect(policy.decide(citizen, "serviceRequest.detail.read")).toMatchObject({
      ok: false,
      code: "FORBIDDEN",
      message: "Role cannot read submitted service requests.",
      reason: "reviewer-only",
      requiredRoles: ["ServiceOfficer", "TeamLead", "Admin"]
    });
  });

  it("allows reviewer roles to read and update submitted records", () => {
    const officer = resolveDemoIdentity({
      roleHeader: "ServiceOfficer",
      subjectHeader: "officer@example.test"
    });

    expect(policy.decide(officer, "serviceRequest.detail.read")).toMatchObject({
      ok: true,
      requiredRoles: ["ServiceOfficer", "TeamLead", "Admin"]
    });
    expect(policy.decide(officer, "serviceRequest.status.update")).toMatchObject({
      ok: true
    });
    expect(policy.decide(officer, "citizen.draft.submit")).toMatchObject({
      ok: false,
      code: "FORBIDDEN",
      message: "Role cannot submit citizen drafts."
    });
  });

  it("keeps operations access admin-only", () => {
    const teamLead = resolveDemoIdentity({
      roleHeader: "TeamLead",
      subjectHeader: "lead@example.test"
    });
    const admin = resolveDemoIdentity({
      roleHeader: "Admin",
      subjectHeader: "admin@example.test"
    });

    expect(policy.decide(teamLead, "operations.read")).toMatchObject({
      ok: false,
      reason: "admin-only"
    });
    expect(policy.decide(admin, "operations.read")).toMatchObject({
      ok: true
    });
  });

  it("returns a normalized denied audit payload", () => {
    const citizen = resolveDemoIdentity({});
    const decision = policy.decide(citizen, "operations.read");

    expect(policy.deniedEventPayload(citizen, decision)).toEqual({
      actorRole: "Citizen",
      actorSubject: "demo.customer@example.test",
      action: "operations.read",
      decision: "DENIED",
      reason: "admin-only",
      requiredRoles: ["Admin"]
    });
  });
});
