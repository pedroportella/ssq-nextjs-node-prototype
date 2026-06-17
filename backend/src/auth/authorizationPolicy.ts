import type { DemoRole, ResolvedIdentity } from "./demoIdentity.js";

export type AuthorizationAction =
  | "citizen.profile.read"
  | "citizen.draft.manage"
  | "citizen.draft.submit"
  | "citizen.serviceRequests.read"
  | "citizen.submissionSummary.download"
  | "citizen.supportingDocuments.read"
  | "operations.read"
  | "serviceRequest.assign"
  | "serviceRequest.batchStatus.update"
  | "serviceRequest.detail.read"
  | "serviceRequest.status.update"
  | "supportingDocument.download"
  | "supportingDocument.upload";

export interface AuthorizationDecision {
  action: AuthorizationAction;
  code?: "FORBIDDEN";
  message?: string;
  ok: boolean;
  reason?: string;
  requiredRoles?: DemoRole[];
}

interface AuthorizationRule {
  allowedRoles: DemoRole[];
  deniedMessage: string;
  reason: string;
}

const citizenRoles: DemoRole[] = ["Citizen"];
const reviewerRoles: DemoRole[] = ["ServiceOfficer", "TeamLead", "Admin"];
const allRoles: DemoRole[] = ["Citizen", "ServiceOfficer", "TeamLead", "Admin"];

const authorizationRules: Record<AuthorizationAction, AuthorizationRule> = {
  "citizen.profile.read": {
    allowedRoles: citizenRoles,
    deniedMessage: "Role cannot read citizen profile.",
    reason: "citizen-only"
  },
  "citizen.draft.manage": {
    allowedRoles: citizenRoles,
    deniedMessage: "Role cannot manage citizen drafts.",
    reason: "citizen-only"
  },
  "citizen.draft.submit": {
    allowedRoles: citizenRoles,
    deniedMessage: "Role cannot submit citizen drafts.",
    reason: "citizen-only"
  },
  "citizen.serviceRequests.read": {
    allowedRoles: citizenRoles,
    deniedMessage: "Role cannot read citizen service requests.",
    reason: "citizen-only"
  },
  "citizen.submissionSummary.download": {
    allowedRoles: citizenRoles,
    deniedMessage: "Role cannot download citizen summaries.",
    reason: "citizen-only"
  },
  "citizen.supportingDocuments.read": {
    allowedRoles: citizenRoles,
    deniedMessage: "Role cannot read citizen supporting documents.",
    reason: "citizen-only"
  },
  "operations.read": {
    allowedRoles: ["Admin"],
    deniedMessage: "Role cannot read operations.",
    reason: "admin-only"
  },
  "serviceRequest.assign": {
    allowedRoles: reviewerRoles,
    deniedMessage: "Role cannot assign service requests.",
    reason: "reviewer-only"
  },
  "serviceRequest.batchStatus.update": {
    allowedRoles: reviewerRoles,
    deniedMessage: "Role cannot update service request status.",
    reason: "reviewer-only"
  },
  "serviceRequest.detail.read": {
    allowedRoles: reviewerRoles,
    deniedMessage: "Role cannot read submitted service requests.",
    reason: "reviewer-only"
  },
  "serviceRequest.status.update": {
    allowedRoles: reviewerRoles,
    deniedMessage: "Role cannot update service request status.",
    reason: "reviewer-only"
  },
  "supportingDocument.download": {
    allowedRoles: allRoles,
    deniedMessage: "Role cannot download supporting documents.",
    reason: "known-demo-role-required"
  },
  "supportingDocument.upload": {
    allowedRoles: citizenRoles,
    deniedMessage: "Role cannot upload citizen documents.",
    reason: "citizen-only"
  }
};

export class AuthorizationPolicyService {
  decide(identity: ResolvedIdentity, action: AuthorizationAction): AuthorizationDecision {
    const rule = authorizationRules[action];

    if (rule.allowedRoles.some((role) => identity.roles.includes(role))) {
      return {
        action,
        ok: true,
        requiredRoles: rule.allowedRoles
      };
    }

    return {
      action,
      code: "FORBIDDEN",
      message: rule.deniedMessage,
      ok: false,
      reason: rule.reason,
      requiredRoles: rule.allowedRoles
    };
  }

  can(identity: ResolvedIdentity, action: AuthorizationAction): boolean {
    return this.decide(identity, action).ok;
  }

  isCitizen(identity: ResolvedIdentity): boolean {
    return this.can(identity, "citizen.profile.read");
  }

  canReadSubmittedRecords(identity: ResolvedIdentity): boolean {
    return this.can(identity, "serviceRequest.detail.read");
  }

  canReadOperations(identity: ResolvedIdentity): boolean {
    return this.can(identity, "operations.read");
  }

  deniedEventPayload(identity: ResolvedIdentity, decision: AuthorizationDecision) {
    return {
      actorRole: identity.role,
      actorSubject: identity.subject,
      action: decision.action,
      decision: "DENIED",
      reason: decision.reason ?? "unknown",
      requiredRoles: decision.requiredRoles ?? []
    };
  }
}

export const authorizationPolicy = new AuthorizationPolicyService();
