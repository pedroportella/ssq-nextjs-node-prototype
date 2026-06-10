import type { PrototypeRepository, ServiceRequestRecord } from "../repositories/prototypeRepository.js";

export type ServiceRequestLifecycleStatus = ServiceRequestRecord["status"];

export type ServiceRequestStatusLifecycleResult =
  | {
      ok: true;
      serviceRequest: ServiceRequestRecord;
    }
  | {
      ok: false;
      code: "SERVICE_REQUEST_NOT_FOUND" | "INVALID_STATUS_TRANSITION";
      message: string;
    };

const allowedTransitions: Record<ServiceRequestLifecycleStatus, ServiceRequestLifecycleStatus[]> = {
  DRAFT: [],
  SUBMITTED: ["UNDER_REVIEW", "WITHDRAWN"],
  UNDER_REVIEW: ["ACTION_REQUIRED", "COMPLETED"],
  ACTION_REQUIRED: ["UNDER_REVIEW", "WITHDRAWN"],
  COMPLETED: [],
  WITHDRAWN: []
};

export class ServiceRequestStatusLifecycleService {
  constructor(private readonly repository: PrototypeRepository) {}

  async transitionStatus(input: {
    customerId: string;
    referenceNumber: string;
    nextStatus: ServiceRequestLifecycleStatus;
    reason?: string;
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

    if (!allowedTransitions[serviceRequest.status].includes(input.nextStatus)) {
      return {
        ok: false,
        code: "INVALID_STATUS_TRANSITION",
        message: `Cannot transition service request from ${serviceRequest.status} to ${input.nextStatus}.`
      };
    }

    const updated = await this.repository.updateServiceRequestStatusForCustomer({
      customerId: input.customerId,
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
        fromStatus: serviceRequest.status,
        reason: input.reason ?? null,
        toStatus: input.nextStatus
      }
    });

    return {
      ok: true,
      serviceRequest: updated
    };
  }
}
