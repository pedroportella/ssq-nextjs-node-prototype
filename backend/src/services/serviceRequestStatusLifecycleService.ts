import { authorizationPolicy } from "../auth/authorizationPolicy.js";
import { evaluateServiceRequestTransitionPolicy, normalizeTransitionReason } from "../policies/serviceRequestReviewPolicy.js";

import type { ResolvedIdentity } from "../auth/demoIdentity.js";
import type { PrototypeRepository, ServiceRequestRecord } from "../repositories/prototypeRepository.js";

export type ServiceRequestLifecycleStatus = ServiceRequestRecord["status"];
export type ServiceRequestLifecycleErrorCode =
  | "FORBIDDEN"
  | "INVALID_ASSIGNMENT"
  | "INVALID_STATUS_TRANSITION"
  | "SERVICE_REQUEST_NOT_FOUND"
  | "TRANSITION_REASON_REQUIRED";

export type ServiceRequestStatusLifecycleResult =
  | {
      ok: true;
      serviceRequest: ServiceRequestRecord;
    }
  | {
      ok: false;
      code: ServiceRequestLifecycleErrorCode;
      message: string;
    };

export type ServiceRequestAssignmentLifecycleResult = ServiceRequestStatusLifecycleResult;

export type ServiceRequestBatchStatusLifecycleResult = {
  ok: boolean;
  results: Array<{
    ok: true;
    referenceNumber: string;
    serviceRequest: ServiceRequestRecord;
  } | {
    ok: false;
    referenceNumber: string;
    error: {
      code: ServiceRequestLifecycleErrorCode;
      message: string;
    };
  }>;
};

export class ServiceRequestStatusLifecycleService {
  constructor(private readonly repository: PrototypeRepository) {}

  async transitionStatus(input: {
    actorIdentity: ResolvedIdentity;
    batch?: boolean;
    customerId: string;
    referenceNumber: string;
    nextStatus: ServiceRequestLifecycleStatus;
    reason?: string | null;
    correlationId: string;
  }): Promise<ServiceRequestStatusLifecycleResult> {
    const serviceRequest = await this.repository.getServiceRequestByReferenceForCustomer({
      customerId: input.customerId,
      referenceNumber: input.referenceNumber
    });

    if (!serviceRequest) {
      return {
        ok: false,
        code: "SERVICE_REQUEST_NOT_FOUND",
        message: "Service request was not found."
      };
    }

    const policy = evaluateServiceRequestTransitionPolicy({
      actorRole: input.actorIdentity.role,
      batch: input.batch,
      fromStatus: serviceRequest.status,
      reason: input.reason,
      toStatus: input.nextStatus
    });

    if (!policy.ok) {
      return {
        ok: false,
        code: policy.code,
        message: policy.message
      };
    }

    const updated = await this.repository.updateServiceRequestStatusForCustomer({
      customerId: input.customerId,
      lastTouchedBy: input.actorIdentity.subject,
      referenceNumber: input.referenceNumber,
      status: input.nextStatus
    });

    if (!updated) {
      return {
        ok: false,
        code: "SERVICE_REQUEST_NOT_FOUND",
        message: "Service request was not found."
      };
    }

    await this.repository.createServiceRequestEvent({
      serviceRequestId: updated.id,
      eventType: "SERVICE_REQUEST_STATUS_CHANGED",
      eventPayload: {
        correlationId: input.correlationId,
        actorRole: input.actorIdentity.role,
        actorSubject: input.actorIdentity.subject,
        actorUserId: input.actorIdentity.userId,
        identitySource: input.actorIdentity.source,
        batch: input.batch === true,
        fromStatus: serviceRequest.status,
        reason: policy.normalizedReason ?? null,
        toStatus: input.nextStatus,
        transitionPolicy: {
          batchSupported: policy.rule.batchSupported,
          reasonRequired: policy.rule.reasonRequired,
          requiredRoles: policy.rule.requiredRoles
        }
      }
    });

    return {
      ok: true,
      serviceRequest: updated
    };
  }

  async batchTransitionStatus(input: {
    actorIdentity: ResolvedIdentity;
    correlationId: string;
    nextStatus: ServiceRequestLifecycleStatus;
    reason?: string | null;
    referenceNumbers: string[];
  }): Promise<ServiceRequestBatchStatusLifecycleResult> {
    const results: ServiceRequestBatchStatusLifecycleResult["results"] = [];

    for (const referenceNumber of input.referenceNumbers) {
      const serviceRequest = await this.repository.getServiceRequestByReference(referenceNumber);

      if (!serviceRequest) {
        results.push({
          ok: false,
          referenceNumber,
          error: {
            code: "SERVICE_REQUEST_NOT_FOUND",
            message: "Service request was not found."
          }
        });
        continue;
      }

      const result = await this.transitionStatus({
        actorIdentity: input.actorIdentity,
        batch: true,
        customerId: serviceRequest.customerId,
        referenceNumber,
        nextStatus: input.nextStatus,
        reason: input.reason,
        correlationId: input.correlationId
      });

      results.push(result.ok
        ? {
            ok: true,
            referenceNumber,
            serviceRequest: result.serviceRequest
          }
        : {
            ok: false,
            referenceNumber,
            error: {
              code: result.code,
              message: result.message
            }
          });
    }

    return {
      ok: results.every((result) => result.ok),
      results
    };
  }

  async assignRequest(input: {
    actorIdentity: ResolvedIdentity;
    assignedOfficerSubject?: string | null;
    assignedTeam?: string | null;
    correlationId: string;
    reason?: string | null;
    referenceNumber: string;
  }): Promise<ServiceRequestAssignmentLifecycleResult> {
    const decision = authorizationPolicy.decide(input.actorIdentity, "serviceRequest.assign");

    if (!decision.ok) {
      return {
        ok: false,
        code: "FORBIDDEN",
        message: decision.message ?? "Role cannot assign service requests."
      };
    }

    const serviceRequest = await this.repository.getServiceRequestByReference(input.referenceNumber);

    if (!serviceRequest || serviceRequest.status === "DRAFT") {
      return {
        ok: false,
        code: "SERVICE_REQUEST_NOT_FOUND",
        message: "Service request was not found."
      };
    }

    const assignedOfficerSubject = normalizeAssignmentValue(input.assignedOfficerSubject);
    const assignedTeam = normalizeAssignmentValue(input.assignedTeam);

    if (assignedOfficerSubject && assignedOfficerSubject.length > 160) {
      return {
        ok: false,
        code: "INVALID_ASSIGNMENT",
        message: "Assigned officer subject must be 160 characters or less."
      };
    }

    if (assignedTeam && assignedTeam.length > 120) {
      return {
        ok: false,
        code: "INVALID_ASSIGNMENT",
        message: "Assigned team must be 120 characters or less."
      };
    }

    const updated = await this.repository.updateServiceRequestAssignment({
      assignedOfficerSubject: assignedOfficerSubject ?? null,
      assignedTeam: assignedTeam ?? null,
      lastTouchedBy: input.actorIdentity.subject,
      referenceNumber: input.referenceNumber
    });

    if (!updated) {
      return {
        ok: false,
        code: "SERVICE_REQUEST_NOT_FOUND",
        message: "Service request was not found."
      };
    }

    await this.repository.createServiceRequestEvent({
      serviceRequestId: updated.id,
      eventType: "SERVICE_REQUEST_ASSIGNMENT_CHANGED",
      eventPayload: {
        correlationId: input.correlationId,
        actorRole: input.actorIdentity.role,
        actorSubject: input.actorIdentity.subject,
        actorUserId: input.actorIdentity.userId,
        identitySource: input.actorIdentity.source,
        assignedOfficerSubject: updated.assignedOfficerSubject ?? null,
        assignedTeam: updated.assignedTeam ?? null,
        previousAssignedOfficerSubject: serviceRequest.assignedOfficerSubject ?? null,
        previousAssignedTeam: serviceRequest.assignedTeam ?? null,
        reason: normalizeTransitionReason(input.reason) ?? null
      }
    });

    return {
      ok: true,
      serviceRequest: updated
    };
  }
}

function normalizeAssignmentValue(value?: string | null): string | undefined {
  const normalizedValue = value?.trim();

  return normalizedValue && normalizedValue.length > 0 ? normalizedValue : undefined;
}
