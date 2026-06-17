import { createLocalIntegrationGateways } from "../gateways/localIntegrationGateways.js";

import type { OutboxEventRecord, OutboxEventSummaryRecord, PrototypeRepository, ServiceRequestRecord, SubmissionSummaryRecord } from "../repositories/prototypeRepository.js";
import type { IntegrationGatewayRegistry } from "../gateways/localIntegrationGateways.js";

export interface OperationsOutboxSummary {
  totals: {
    pending: number;
    processed: number;
    failed: number;
  };
  byEventType: Array<{
    eventType: string;
    pending: number;
    processed: number;
    failed: number;
    total: number;
  }>;
}

export class OutboxEventService {
  constructor(
    private readonly repository: PrototypeRepository,
    private readonly gateways: IntegrationGatewayRegistry = createLocalIntegrationGateways()
  ) {}

  async createSubmissionEvents(input: {
    serviceRequest: ServiceRequestRecord;
    summary: SubmissionSummaryRecord;
    correlationId: string;
    transactionKey: string;
    transactionLabel: string;
  }): Promise<OutboxEventRecord[]> {
    const commonPayload = {
      correlationId: input.correlationId,
      referenceNumber: input.serviceRequest.referenceNumber,
      serviceRequestId: input.serviceRequest.id,
      transactionKey: input.transactionKey,
      transactionLabel: input.transactionLabel
    };

    const notificationRequest = this.gateways.notification.requestSubmissionConfirmation(commonPayload);
    const agencyReviewRequest = this.gateways.agencyReview.requestReview({
      ...commonPayload,
      serviceRequest: input.serviceRequest,
      summary: input.summary
    });

    return Promise.all([
      this.repository.createOutboxEvent({
        eventType: "ServiceRequestSubmitted",
        aggregateType: "ServiceRequest",
        aggregateId: input.serviceRequest.id,
        eventPayload: {
          ...commonPayload,
          status: input.serviceRequest.status
        }
      }),
      this.repository.createOutboxEvent({
        eventType: "SubmissionSummaryCreated",
        aggregateType: "SubmissionSummary",
        aggregateId: input.summary.id,
        eventPayload: {
          ...commonPayload,
          summaryId: input.summary.id,
          contentType: input.summary.contentType,
          fileName: input.summary.fileName
        }
      }),
      this.repository.createOutboxEvent({
        eventType: "NotificationRequested",
        aggregateType: "ServiceRequest",
        aggregateId: input.serviceRequest.id,
        eventPayload: {
          ...commonPayload,
          ...notificationRequest
        }
      }),
      this.repository.createOutboxEvent({
        eventType: "AgencyReviewRequested",
        aggregateType: "ServiceRequest",
        aggregateId: input.serviceRequest.id,
        eventPayload: {
          ...commonPayload,
          ...agencyReviewRequest
        }
      })
    ]);
  }

  async getOperationsSummary(): Promise<OperationsOutboxSummary> {
    return summarizeOutboxEvents(await this.repository.listOutboxEventSummaries());
  }
}

function summarizeOutboxEvents(rows: OutboxEventSummaryRecord[]): OperationsOutboxSummary {
  const totals = {
    pending: 0,
    processed: 0,
    failed: 0
  };
  const byEventType = new Map<string, OperationsOutboxSummary["byEventType"][number]>();

  for (const row of rows) {
    const statusKey = statusToKey(row.status);
    totals[statusKey] += row.eventCount;

    const summary = byEventType.get(row.eventType) ?? {
      eventType: row.eventType,
      pending: 0,
      processed: 0,
      failed: 0,
      total: 0
    };

    summary[statusKey] += row.eventCount;
    summary.total += row.eventCount;
    byEventType.set(row.eventType, summary);
  }

  return {
    totals,
    byEventType: [...byEventType.values()].sort((left, right) => left.eventType.localeCompare(right.eventType))
  };
}

function statusToKey(status: OutboxEventSummaryRecord["status"]): keyof OperationsOutboxSummary["totals"] {
  switch (status) {
    case "PROCESSED":
      return "processed";
    case "FAILED":
      return "failed";
    case "PENDING":
      return "pending";
  }
}
