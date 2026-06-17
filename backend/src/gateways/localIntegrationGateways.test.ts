import { describe, expect, it } from "vitest";

import { createLocalIntegrationGateways, LocalAgencyReviewGateway, LocalNotificationGateway } from "./localIntegrationGateways.js";

describe("local integration gateways", () => {
  it("creates deterministic customer profile evidence metadata", () => {
    const gateways = createLocalIntegrationGateways();

    expect(gateways.customerProfileEvidence.createEvidence({
      attribute: {
        id: "40000000-0000-4000-8000-000000000001",
        customerId: "10000000-0000-4000-8000-000000000001",
        attributeKey: "residency",
        attributeValue: {
          state: "QLD",
          verified: true
        }
      },
      transactionKey: "seniors-card",
      transactionSchemaVersion: "2026-06-10"
    })).toMatchObject({
      verificationStatus: "SIMULATED_VERIFIED",
      evidenceMetadata: {
        availability: "AVAILABLE_LOCAL",
        gateway: "local-customer-profile-evidence-gateway",
        gatewayMode: "LOCAL_ADAPTER",
        integrationClaim: "local-adapter-only",
        source: "prototype-customer-profile",
        transactionKey: "seniors-card",
        transactionSchemaVersion: "2026-06-10"
      }
    });
  });

  it("represents unavailable customer profile evidence without claiming upstream access", () => {
    const gateways = createLocalIntegrationGateways({
      customerProfileAvailability: "UNAVAILABLE_LOCAL"
    });

    expect(gateways.customerProfileEvidence.createEvidence({
      attribute: {
        id: "40000000-0000-4000-8000-000000000001",
        customerId: "10000000-0000-4000-8000-000000000001",
        attributeKey: "residency",
        attributeValue: {
          state: "QLD",
          verified: true
        }
      },
      transactionKey: "seniors-card",
      transactionSchemaVersion: "2026-06-10"
    })).toMatchObject({
      verificationStatus: "SIMULATED_UNVERIFIED",
      evidenceMetadata: {
        availability: "UNAVAILABLE_LOCAL",
        unavailableReason: "Local adapter configured unavailable for deterministic failure testing."
      }
    });
  });

  it("creates deterministic notification and agency handoff requests", () => {
    expect(new LocalNotificationGateway().requestSubmissionConfirmation({
      correlationId: "test-correlation",
      referenceNumber: "SSQ-TEST-0001",
      serviceRequestId: "30000000-0000-4000-8000-000000000001",
      transactionKey: "seniors-card",
      transactionLabel: "Seniors Card"
    })).toMatchObject({
      availability: "AVAILABLE_LOCAL",
      channel: "prototype-email",
      deliveryStatus: "REQUESTED_LOCAL",
      gateway: "local-notification-gateway",
      gatewayMode: "LOCAL_ADAPTER",
      notificationType: "submission-confirmation"
    });
    expect(new LocalAgencyReviewGateway().requestReview({
      correlationId: "test-correlation",
      referenceNumber: "SSQ-TEST-0001",
      serviceRequest: {
        id: "30000000-0000-4000-8000-000000000001",
        customerId: "10000000-0000-4000-8000-000000000001",
        transactionDefinitionId: "20000000-0000-4000-8000-000000000002",
        referenceNumber: "SSQ-TEST-0001",
        status: "SUBMITTED",
        payload: {},
        createdAt: "2026-06-10T00:00:00.000Z",
        updatedAt: "2026-06-10T00:00:00.000Z"
      },
      summary: {
        id: "91000000-0000-4000-8000-000000000001",
        serviceRequestId: "30000000-0000-4000-8000-000000000001",
        summaryFormat: "TEXT",
        contentType: "text/plain; charset=utf-8",
        fileName: "SSQ-TEST-0001-summary.txt",
        summaryPayload: {},
        summaryText: "Reference: SSQ-TEST-0001",
        createdAt: "2026-06-10T00:00:00.000Z",
        updatedAt: "2026-06-10T00:00:00.000Z"
      },
      transactionKey: "seniors-card",
      transactionLabel: "Seniors Card"
    })).toMatchObject({
      availability: "AVAILABLE_LOCAL",
      gateway: "local-agency-review-gateway",
      gatewayMode: "LOCAL_ADAPTER",
      handoffStatus: "QUEUED_LOCAL",
      reviewQueue: "prototype-agency-review"
    });
  });

  it("makes unavailable notification and agency handoff states explicit", () => {
    expect(new LocalNotificationGateway("UNAVAILABLE_LOCAL").requestSubmissionConfirmation({
      correlationId: "test-correlation",
      referenceNumber: "SSQ-TEST-0001",
      serviceRequestId: "30000000-0000-4000-8000-000000000001",
      transactionKey: "seniors-card",
      transactionLabel: "Seniors Card"
    })).toMatchObject({
      availability: "UNAVAILABLE_LOCAL",
      deliveryStatus: "NOT_REQUESTED_LOCAL",
      unavailableReason: "Local adapter configured unavailable for deterministic failure testing."
    });
    expect(new LocalAgencyReviewGateway("UNAVAILABLE_LOCAL").requestReview({
      correlationId: "test-correlation",
      referenceNumber: "SSQ-TEST-0001",
      serviceRequest: {
        id: "30000000-0000-4000-8000-000000000001",
        customerId: "10000000-0000-4000-8000-000000000001",
        transactionDefinitionId: "20000000-0000-4000-8000-000000000002",
        referenceNumber: "SSQ-TEST-0001",
        status: "SUBMITTED",
        payload: {},
        createdAt: "2026-06-10T00:00:00.000Z",
        updatedAt: "2026-06-10T00:00:00.000Z"
      },
      summary: {
        id: "91000000-0000-4000-8000-000000000001",
        serviceRequestId: "30000000-0000-4000-8000-000000000001",
        summaryFormat: "TEXT",
        contentType: "text/plain; charset=utf-8",
        fileName: "SSQ-TEST-0001-summary.txt",
        summaryPayload: {},
        summaryText: "Reference: SSQ-TEST-0001",
        createdAt: "2026-06-10T00:00:00.000Z",
        updatedAt: "2026-06-10T00:00:00.000Z"
      },
      transactionKey: "seniors-card",
      transactionLabel: "Seniors Card"
    })).toMatchObject({
      availability: "UNAVAILABLE_LOCAL",
      handoffStatus: "NOT_QUEUED_LOCAL",
      unavailableReason: "Local adapter configured unavailable for deterministic failure testing."
    });
  });
});
