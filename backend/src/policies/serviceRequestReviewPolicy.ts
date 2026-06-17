import type { DemoRole } from "../auth/demoIdentity.js";
import type { ServiceRequestRecord } from "../repositories/prototypeRepository.js";

export type ServiceRequestReviewStatus = ServiceRequestRecord["status"];

export interface ServiceRequestTransitionRule {
  batchSupported: boolean;
  fromStatus: ServiceRequestReviewStatus;
  reasonRequired: boolean;
  requiredRoles: DemoRole[];
  toStatus: ServiceRequestReviewStatus;
}

const reviewerRoles: DemoRole[] = ["ServiceOfficer", "TeamLead", "Admin"];

export const serviceRequestTransitionRules: ServiceRequestTransitionRule[] = [
  {
    batchSupported: true,
    fromStatus: "SUBMITTED",
    reasonRequired: false,
    requiredRoles: reviewerRoles,
    toStatus: "UNDER_REVIEW"
  },
  {
    batchSupported: false,
    fromStatus: "SUBMITTED",
    reasonRequired: true,
    requiredRoles: ["TeamLead", "Admin"],
    toStatus: "WITHDRAWN"
  },
  {
    batchSupported: true,
    fromStatus: "UNDER_REVIEW",
    reasonRequired: true,
    requiredRoles: reviewerRoles,
    toStatus: "ACTION_REQUIRED"
  },
  {
    batchSupported: true,
    fromStatus: "UNDER_REVIEW",
    reasonRequired: true,
    requiredRoles: reviewerRoles,
    toStatus: "COMPLETED"
  },
  {
    batchSupported: true,
    fromStatus: "ACTION_REQUIRED",
    reasonRequired: false,
    requiredRoles: reviewerRoles,
    toStatus: "UNDER_REVIEW"
  },
  {
    batchSupported: false,
    fromStatus: "ACTION_REQUIRED",
    reasonRequired: true,
    requiredRoles: ["TeamLead", "Admin"],
    toStatus: "WITHDRAWN"
  }
];

export type ServiceRequestTransitionPolicyResult =
  | {
      ok: true;
      normalizedReason?: string;
      rule: ServiceRequestTransitionRule;
    }
  | {
      ok: false;
      code: "FORBIDDEN" | "INVALID_STATUS_TRANSITION" | "TRANSITION_REASON_REQUIRED";
      message: string;
      rule?: ServiceRequestTransitionRule;
    };

export function evaluateServiceRequestTransitionPolicy(input: {
  actorRole: DemoRole;
  batch?: boolean;
  fromStatus: ServiceRequestReviewStatus;
  reason?: string | null;
  toStatus: ServiceRequestReviewStatus;
}): ServiceRequestTransitionPolicyResult {
  const rule = serviceRequestTransitionRules.find(
    (candidate) => candidate.fromStatus === input.fromStatus && candidate.toStatus === input.toStatus
  );

  if (!rule) {
    return {
      ok: false,
      code: "INVALID_STATUS_TRANSITION",
      message: `Cannot transition service request from ${input.fromStatus} to ${input.toStatus}.`
    };
  }

  if (!rule.requiredRoles.includes(input.actorRole)) {
    return {
      ok: false,
      code: "FORBIDDEN",
      message: `Role cannot transition service request from ${input.fromStatus} to ${input.toStatus}.`,
      rule
    };
  }

  if (input.batch && !rule.batchSupported) {
    return {
      ok: false,
      code: "INVALID_STATUS_TRANSITION",
      message: `Transition from ${input.fromStatus} to ${input.toStatus} is not available for batch updates.`,
      rule
    };
  }

  const normalizedReason = normalizeTransitionReason(input.reason);

  if (rule.reasonRequired && !normalizedReason) {
    return {
      ok: false,
      code: "TRANSITION_REASON_REQUIRED",
      message: `A reason is required to transition service request from ${input.fromStatus} to ${input.toStatus}.`,
      rule
    };
  }

  return {
    ok: true,
    normalizedReason,
    rule
  };
}

export function normalizeTransitionReason(reason?: string | null): string | undefined {
  const normalizedReason = reason?.trim();

  return normalizedReason && normalizedReason.length > 0 ? normalizedReason : undefined;
}
