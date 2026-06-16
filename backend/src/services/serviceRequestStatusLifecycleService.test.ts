import { describe, expect, it } from "vitest";

import { ServiceRequestStatusLifecycleService } from "./serviceRequestStatusLifecycleService.js";

import type { PrototypeRepository, ServiceRequestRecord } from "../repositories/prototypeRepository.js";

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

function createRepository(serviceRequest: ServiceRequestRecord | undefined): PrototypeRepository {
  return {
    async getServiceRequestByReferenceForCustomer() {
      return serviceRequest;
    },
    async updateServiceRequestStatusForCustomer(input: { status: ServiceRequestRecord["status"] }) {
      return serviceRequest ? { ...serviceRequest, status: input.status } : undefined;
    },
    async createServiceRequestEvent() {
      return {
        id: "60000000-0000-4000-8000-000000000001",
        serviceRequestId: "30000000-0000-4000-8000-000000000001",
        eventType: "SERVICE_REQUEST_STATUS_CHANGED",
        eventPayload: {},
        createdAt: "2026-06-10T00:00:00.000Z"
      };
    }
  } as unknown as PrototypeRepository;
}

describe("ServiceRequestStatusLifecycleService", () => {
  it("allows submitted requests to move under review", async () => {
    const service = new ServiceRequestStatusLifecycleService(createRepository(createServiceRequest("SUBMITTED")));

    await expect(service.transitionStatus({
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
    const service = new ServiceRequestStatusLifecycleService(createRepository(createServiceRequest("UNDER_REVIEW")));

    await expect(service.transitionStatus({
      customerId: "10000000-0000-4000-8000-000000000001",
      referenceNumber: "SSQ-DEMO-0001",
      nextStatus: "ACTION_REQUIRED",
      correlationId: "status-correlation"
    })).resolves.toMatchObject({
      ok: true,
      serviceRequest: {
        status: "ACTION_REQUIRED"
      }
    });

    await expect(service.transitionStatus({
      customerId: "10000000-0000-4000-8000-000000000001",
      referenceNumber: "SSQ-DEMO-0001",
      nextStatus: "COMPLETED",
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

  it("returns safe not found for missing or non-owned requests", async () => {
    const service = new ServiceRequestStatusLifecycleService(createRepository(undefined));

    await expect(service.transitionStatus({
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
