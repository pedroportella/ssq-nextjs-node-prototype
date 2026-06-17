import { describe, expect, it } from "vitest";

import { resolveDemoIdentity } from "../auth/demoIdentity.js";
import { ServiceRequestStatusLifecycleService } from "./serviceRequestStatusLifecycleService.js";

import type { DemoRole, ResolvedIdentity } from "../auth/demoIdentity.js";
import type { PrototypeRepository, ServiceRequestEventRecord, ServiceRequestRecord } from "../repositories/prototypeRepository.js";

function createIdentity(role: DemoRole = "ServiceOfficer", subject = "officer@example.test"): ResolvedIdentity {
  return resolveDemoIdentity({
    roleHeader: role,
    subjectHeader: subject
  });
}

function createServiceRequest(status: ServiceRequestRecord["status"]): ServiceRequestRecord {
  return {
    id: "30000000-0000-4000-8000-000000000001",
    customerId: "10000000-0000-4000-8000-000000000001",
    transactionDefinitionId: "20000000-0000-4000-8000-000000000002",
    referenceNumber: "SSQ-DEMO-0001",
    status,
    payload: {},
    createdAt: "2026-06-10T00:00:00.000Z",
    updatedAt: "2026-06-10T00:00:00.000Z",
    transactionKey: "seniors-card"
  };
}

function createRepository(
  serviceRequestInput: ServiceRequestRecord | ServiceRequestRecord[] | undefined,
  events: ServiceRequestEventRecord[] = []
): PrototypeRepository {
  const serviceRequests = (Array.isArray(serviceRequestInput) ? serviceRequestInput : serviceRequestInput ? [serviceRequestInput] : []);

  return {
    async getServiceRequestByReference(referenceNumber: string) {
      return serviceRequests.find((serviceRequest) => serviceRequest.referenceNumber === referenceNumber);
    },
    async getServiceRequestByReferenceForCustomer(input: { customerId: string; referenceNumber: string }) {
      return serviceRequests.find(
        (serviceRequest) => serviceRequest.customerId === input.customerId && serviceRequest.referenceNumber === input.referenceNumber
      );
    },
    async updateServiceRequestStatusForCustomer(input: {
      customerId: string;
      lastTouchedBy?: string;
      referenceNumber: string;
      status: ServiceRequestRecord["status"];
    }) {
      const serviceRequest = serviceRequests.find(
        (candidate) => candidate.customerId === input.customerId && candidate.referenceNumber === input.referenceNumber
      );

      if (!serviceRequest) {
        return undefined;
      }

      serviceRequest.status = input.status;
      serviceRequest.lastTouchedBy = input.lastTouchedBy;
      serviceRequest.lastTouchedAt = "2026-06-10T00:30:00.000Z";

      return serviceRequest;
    },
    async updateServiceRequestAssignment(input: {
      assignedOfficerSubject?: string | null;
      assignedTeam?: string | null;
      lastTouchedBy: string;
      referenceNumber: string;
    }) {
      const serviceRequest = serviceRequests.find((candidate) => candidate.referenceNumber === input.referenceNumber);

      if (!serviceRequest || serviceRequest.status === "DRAFT") {
        return undefined;
      }

      serviceRequest.assignedOfficerSubject = input.assignedOfficerSubject ?? undefined;
      serviceRequest.assignedTeam = input.assignedTeam ?? undefined;
      serviceRequest.lastTouchedBy = input.lastTouchedBy;
      serviceRequest.lastTouchedAt = "2026-06-10T00:35:00.000Z";

      return serviceRequest;
    },
    async createServiceRequestEvent(input: {
      serviceRequestId: string;
      eventType: string;
      eventPayload?: Record<string, unknown>;
    }) {
      const event = {
        id: "60000000-0000-4000-8000-000000000001",
        serviceRequestId: input.serviceRequestId,
        eventType: input.eventType,
        eventPayload: input.eventPayload ?? {},
        createdAt: "2026-06-10T00:00:00.000Z"
      };

      events.push(event);

      return event;
    }
  } as unknown as PrototypeRepository;
}

describe("ServiceRequestStatusLifecycleService", () => {
  it("allows submitted requests to move under review", async () => {
    const service = new ServiceRequestStatusLifecycleService(createRepository(createServiceRequest("SUBMITTED")));

    await expect(service.transitionStatus({
      actorIdentity: createIdentity(),
      customerId: "10000000-0000-4000-8000-000000000001",
      referenceNumber: "SSQ-DEMO-0001",
      nextStatus: "UNDER_REVIEW",
      correlationId: "status-correlation"
    })).resolves.toMatchObject({
      ok: true,
      serviceRequest: {
        status: "UNDER_REVIEW"
      }
    });
  });

  it("allows under review requests to complete or request action", async () => {
    const actionRequiredService = new ServiceRequestStatusLifecycleService(createRepository(createServiceRequest("UNDER_REVIEW")));

    await expect(actionRequiredService.transitionStatus({
      actorIdentity: createIdentity(),
      customerId: "10000000-0000-4000-8000-000000000001",
      referenceNumber: "SSQ-DEMO-0001",
      nextStatus: "ACTION_REQUIRED",
      reason: "Need more evidence",
      correlationId: "status-correlation"
    })).resolves.toMatchObject({
      ok: true,
      serviceRequest: {
        status: "ACTION_REQUIRED"
      }
    });

    const completedService = new ServiceRequestStatusLifecycleService(createRepository(createServiceRequest("UNDER_REVIEW")));

    await expect(completedService.transitionStatus({
      actorIdentity: createIdentity(),
      customerId: "10000000-0000-4000-8000-000000000001",
      referenceNumber: "SSQ-DEMO-0001",
      nextStatus: "COMPLETED",
      reason: "Approved",
      correlationId: "status-correlation"
    })).resolves.toMatchObject({
      ok: true,
      serviceRequest: {
        status: "COMPLETED"
      }
    });
  });

  it("rejects disallowed transitions", async () => {
    const service = new ServiceRequestStatusLifecycleService(createRepository(createServiceRequest("SUBMITTED")));

    await expect(service.transitionStatus({
      actorIdentity: createIdentity(),
      customerId: "10000000-0000-4000-8000-000000000001",
      referenceNumber: "SSQ-DEMO-0001",
      nextStatus: "COMPLETED",
      correlationId: "status-correlation"
    })).resolves.toEqual({
      ok: false,
      code: "INVALID_STATUS_TRANSITION",
      message: "Cannot transition service request from SUBMITTED to COMPLETED."
    });
  });

  it("requires reasons for outcome transitions", async () => {
    const service = new ServiceRequestStatusLifecycleService(createRepository(createServiceRequest("UNDER_REVIEW")));

    await expect(service.transitionStatus({
      actorIdentity: createIdentity(),
      customerId: "10000000-0000-4000-8000-000000000001",
      referenceNumber: "SSQ-DEMO-0001",
      nextStatus: "COMPLETED",
      correlationId: "status-correlation"
    })).resolves.toEqual({
      ok: false,
      code: "TRANSITION_REASON_REQUIRED",
      message: "A reason is required to transition service request from UNDER_REVIEW to COMPLETED."
    });
  });

  it("records assignment changes with actor audit payload", async () => {
    const events: ServiceRequestEventRecord[] = [];
    const service = new ServiceRequestStatusLifecycleService(createRepository(createServiceRequest("SUBMITTED"), events));

    await expect(service.assignRequest({
      actorIdentity: createIdentity(),
      assignedOfficerSubject: "officer@example.test",
      assignedTeam: "Seniors Card",
      correlationId: "assignment-correlation",
      reason: "Picked up from queue",
      referenceNumber: "SSQ-DEMO-0001"
    })).resolves.toMatchObject({
      ok: true,
      serviceRequest: {
        assignedOfficerSubject: "officer@example.test",
        assignedTeam: "Seniors Card",
        lastTouchedBy: "officer@example.test"
      }
    });
    expect(events).toEqual([
      expect.objectContaining({
        eventType: "SERVICE_REQUEST_ASSIGNMENT_CHANGED",
        eventPayload: expect.objectContaining({
          actorRole: "ServiceOfficer",
          actorSubject: "officer@example.test",
          assignedOfficerSubject: "officer@example.test",
          assignedTeam: "Seniors Card",
          correlationId: "assignment-correlation",
          reason: "Picked up from queue"
        })
      })
    ]);
  });

  it("returns per-record results for batch transitions", async () => {
    const first = createServiceRequest("SUBMITTED");
    const second = {
      ...createServiceRequest("UNDER_REVIEW"),
      id: "30000000-0000-4000-8000-000000000002",
      referenceNumber: "SSQ-DEMO-0002"
    };
    const service = new ServiceRequestStatusLifecycleService(createRepository([first, second]));

    await expect(service.batchTransitionStatus({
      actorIdentity: createIdentity(),
      correlationId: "batch-correlation",
      nextStatus: "UNDER_REVIEW",
      referenceNumbers: ["SSQ-DEMO-0001", "SSQ-DEMO-0002", "SSQ-MISSING"]
    })).resolves.toMatchObject({
      ok: false,
      results: [
        {
          ok: true,
          referenceNumber: "SSQ-DEMO-0001",
          serviceRequest: {
            status: "UNDER_REVIEW"
          }
        },
        {
          ok: false,
          referenceNumber: "SSQ-DEMO-0002",
          error: {
            code: "INVALID_STATUS_TRANSITION"
          }
        },
        {
          ok: false,
          referenceNumber: "SSQ-MISSING",
          error: {
            code: "SERVICE_REQUEST_NOT_FOUND"
          }
        }
      ]
    });
  });

  it("returns safe not found for missing or non-owned requests", async () => {
    const service = new ServiceRequestStatusLifecycleService(createRepository(undefined));

    await expect(service.transitionStatus({
      actorIdentity: createIdentity(),
      customerId: "10000000-0000-4000-8000-000000000999",
      referenceNumber: "SSQ-DEMO-0001",
      nextStatus: "UNDER_REVIEW",
      correlationId: "status-correlation"
    })).resolves.toEqual({
      ok: false,
      code: "SERVICE_REQUEST_NOT_FOUND",
      message: "Service request was not found."
    });
  });
});
