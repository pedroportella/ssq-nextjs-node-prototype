import type { CustomerProfileAttributeRecord, ServiceRequestRecord, SubmissionSummaryRecord } from "../repositories/prototypeRepository.js";

export type LocalGatewayAvailability = "AVAILABLE_LOCAL" | "UNAVAILABLE_LOCAL";
export type LocalGatewayMode = "LOCAL_ADAPTER";

export interface LocalGatewayMetadata {
  availability: LocalGatewayAvailability;
  gateway: string;
  gatewayMode: LocalGatewayMode;
  productionNext: string[];
  unavailableReason?: string;
}

export interface CustomerProfileEvidenceGatewayResult {
  attributeValue: Record<string, unknown>;
  evidenceMetadata: Record<string, unknown>;
  verificationStatus: "SIMULATED_VERIFIED" | "SIMULATED_UNVERIFIED";
}

export interface CustomerProfileEvidenceGateway {
  createEvidence(input: {
    attribute: CustomerProfileAttributeRecord;
    transactionKey: string;
    transactionSchemaVersion: string;
  }): CustomerProfileEvidenceGatewayResult;
}

export interface NotificationGatewayResult extends LocalGatewayMetadata {
  channel: "prototype-email";
  deliveryStatus: "REQUESTED_LOCAL" | "NOT_REQUESTED_LOCAL";
  notificationType: "submission-confirmation";
}

export interface NotificationGateway {
  requestSubmissionConfirmation(input: {
    correlationId: string;
    referenceNumber: string;
    serviceRequestId: string;
    transactionKey: string;
    transactionLabel: string;
  }): NotificationGatewayResult;
}

export interface AgencyReviewGatewayResult extends LocalGatewayMetadata {
  handoffStatus: "QUEUED_LOCAL" | "NOT_QUEUED_LOCAL";
  reviewQueue: "prototype-agency-review";
}

export interface AgencyReviewGateway {
  requestReview(input: {
    correlationId: string;
    referenceNumber: string;
    serviceRequest: ServiceRequestRecord;
    summary: SubmissionSummaryRecord;
    transactionKey: string;
    transactionLabel: string;
  }): AgencyReviewGatewayResult;
}

export interface IntegrationGatewayRegistry {
  agencyReview: AgencyReviewGateway;
  customerProfileEvidence: CustomerProfileEvidenceGateway;
  notification: NotificationGateway;
}

export class LocalCustomerProfileEvidenceGateway implements CustomerProfileEvidenceGateway {
  constructor(private readonly availability: LocalGatewayAvailability = "AVAILABLE_LOCAL") {}

  createEvidence(input: {
    attribute: CustomerProfileAttributeRecord;
    transactionKey: string;
    transactionSchemaVersion: string;
  }): CustomerProfileEvidenceGatewayResult {
    const verified = this.availability === "AVAILABLE_LOCAL" && input.attribute.attributeValue.verified === true;

    return {
      attributeValue: input.attribute.attributeValue,
      evidenceMetadata: {
        ...localGatewayMetadata("local-customer-profile-evidence-gateway", this.availability, [
          "replace-local-profile-adapter-with-authoritative-source",
          "digital-identity-verification",
          "privacy-impact-review"
        ]),
        integrationClaim: "local-adapter-only",
        source: "prototype-customer-profile",
        transactionKey: input.transactionKey,
        transactionSchemaVersion: input.transactionSchemaVersion
      },
      verificationStatus: verified ? "SIMULATED_VERIFIED" : "SIMULATED_UNVERIFIED"
    };
  }
}

export class LocalNotificationGateway implements NotificationGateway {
  constructor(private readonly availability: LocalGatewayAvailability = "AVAILABLE_LOCAL") {}

  requestSubmissionConfirmation(_input: {
    correlationId: string;
    referenceNumber: string;
    serviceRequestId: string;
    transactionKey: string;
    transactionLabel: string;
  }): NotificationGatewayResult {
    return {
      ...localGatewayMetadata("local-notification-gateway", this.availability, [
        "replace-local-notification-adapter-with-notification-platform",
        "add-delivery-retry-and-bounce-handling",
        "add-template-versioning"
      ]),
      channel: "prototype-email",
      deliveryStatus: this.availability === "AVAILABLE_LOCAL" ? "REQUESTED_LOCAL" : "NOT_REQUESTED_LOCAL",
      notificationType: "submission-confirmation"
    };
  }
}

export class LocalAgencyReviewGateway implements AgencyReviewGateway {
  constructor(private readonly availability: LocalGatewayAvailability = "AVAILABLE_LOCAL") {}

  requestReview(_input: {
    correlationId: string;
    referenceNumber: string;
    serviceRequest: ServiceRequestRecord;
    summary: SubmissionSummaryRecord;
    transactionKey: string;
    transactionLabel: string;
  }): AgencyReviewGatewayResult {
    return {
      ...localGatewayMetadata("local-agency-review-gateway", this.availability, [
        "replace-local-review-queue-with-agency-casework-integration",
        "define-retry-and-dead-letter-handling",
        "confirm-agency-queue-routing-rules"
      ]),
      handoffStatus: this.availability === "AVAILABLE_LOCAL" ? "QUEUED_LOCAL" : "NOT_QUEUED_LOCAL",
      reviewQueue: "prototype-agency-review"
    };
  }
}

export function createLocalIntegrationGateways(input: {
  agencyReviewAvailability?: LocalGatewayAvailability;
  customerProfileAvailability?: LocalGatewayAvailability;
  notificationAvailability?: LocalGatewayAvailability;
} = {}): IntegrationGatewayRegistry {
  return {
    agencyReview: new LocalAgencyReviewGateway(input.agencyReviewAvailability),
    customerProfileEvidence: new LocalCustomerProfileEvidenceGateway(input.customerProfileAvailability),
    notification: new LocalNotificationGateway(input.notificationAvailability)
  };
}

function localGatewayMetadata(
  gateway: string,
  availability: LocalGatewayAvailability,
  productionNext: string[]
): LocalGatewayMetadata {
  return {
    availability,
    gateway,
    gatewayMode: "LOCAL_ADAPTER",
    productionNext,
    ...(availability === "UNAVAILABLE_LOCAL"
      ? { unavailableReason: "Local adapter configured unavailable for deterministic failure testing." }
      : {})
  };
}
