import type { PrototypeRepository, ServiceRequestRecord, SubmissionSummaryRecord } from "../repositories/prototypeRepository.js";

export class SubmissionSummaryService {
  constructor(private readonly repository: PrototypeRepository) {}

  async createSummary(input: {
    serviceRequest: ServiceRequestRecord;
    transactionLabel: string;
  }): Promise<SubmissionSummaryRecord> {
    const summaryPayload = {
      generatedBy: "ssq-prototype",
      referenceNumber: input.serviceRequest.referenceNumber,
      status: input.serviceRequest.status,
      submittedPayload: input.serviceRequest.payload,
      transactionKey: input.serviceRequest.transactionKey,
      transactionLabel: input.transactionLabel
    };
    const summaryText = [
      "Smart Service Queensland prototype submission summary",
      `Reference: ${input.serviceRequest.referenceNumber}`,
      `Transaction: ${input.transactionLabel}`,
      `Status: ${input.serviceRequest.status}`,
      "",
      "Submitted payload:",
      JSON.stringify(input.serviceRequest.payload, null, 2),
      "",
      "Prototype note: this text file is a local review artifact, not an official receipt."
    ].join("\n");

    return this.repository.createSubmissionSummary({
      serviceRequestId: input.serviceRequest.id,
      summaryFormat: "TEXT",
      contentType: "text/plain; charset=utf-8",
      fileName: `${input.serviceRequest.referenceNumber}-summary.txt`,
      summaryPayload,
      summaryText
    });
  }
}
