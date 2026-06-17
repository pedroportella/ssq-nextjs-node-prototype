import { GraphQLScalarType, Kind } from "graphql";
import { createSchema } from "graphql-yoga";

import { canReadSubmittedRecords, isCitizen } from "../auth/demoIdentity.js";

import type { GraphqlContext } from "./context.js";
import type { CustomerRecord, ServiceRequestListInput } from "../repositories/prototypeRepository.js";
import type { ServiceRequestBatchStatusLifecycleResult } from "../services/serviceRequestStatusLifecycleService.js";

type JsonValue = boolean | number | string | null | JsonValue[] | { [key: string]: JsonValue };
type ServiceRequestListQueryInput = Partial<{
  status: string | null;
  search: string | null;
  page: number | null;
  pageSize: number | null;
  sortBy: string | null;
  sortDirection: string | null;
}>;

const jsonScalar: GraphQLScalarType = new GraphQLScalarType({
  name: "JSON",
  parseLiteral(ast) {
    return parseJsonLiteral(ast);
  },
  parseValue(value) {
    return value;
  },
  serialize(value) {
    return value;
  }
});

function parseJsonLiteral(ast: Parameters<GraphQLScalarType["parseLiteral"]>[0]): JsonValue | undefined {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.INT:
    case Kind.FLOAT:
      return Number(ast.value);
    case Kind.OBJECT:
      return Object.fromEntries(ast.fields.map((field) => [field.name.value, parseJsonLiteral(field.value) ?? null]));
    case Kind.LIST:
      return ast.values.map((value) => parseJsonLiteral(value) ?? null);
    case Kind.NULL:
      return null;
    default:
      return undefined;
  }
}

export const schema = createSchema<GraphqlContext>({
  typeDefs: /* GraphQL */ `
    scalar JSON

    type Viewer {
      id: ID!
      externalRef: String!
      email: String!
      givenName: String!
      familyName: String!
    }

    type ProfileAttribute {
      id: ID!
      key: String!
      value: JSON!
    }

    type CustomerProfileEvidence {
      id: ID!
      serviceRequestId: ID!
      customerProfileAttributeId: ID
      attributeKey: String!
      attributeValue: JSON!
      evidenceSource: String!
      verificationStatus: String!
      evidenceMetadata: JSON!
      createdAt: String!
    }

    type CustomerProfile {
      customer: Viewer!
      attributes: [ProfileAttribute!]!
      serviceRequests: [ServiceRequest!]!
    }

    type FeatureFlag {
      id: ID!
      key: String!
      description: String!
      enabled: Boolean!
      metadata: JSON!
    }

    type TransactionDefinition {
      id: ID!
      key: String!
      label: String!
      description: String!
      status: String!
      owningAgency: String!
    }

    type TransactionSchema {
      transactionKey: String!
      schemaVersion: String!
      schema: JSON!
    }

    type TransactionCatalogueEntry {
      definition: TransactionDefinition!
      schemaVersion: String!
      schema: JSON!
      featureFlagKey: String!
      featureEnabled: Boolean!
    }

    type ServiceRequest {
      id: ID!
      customerId: ID!
      transactionDefinitionId: ID!
      transactionKey: String
      referenceNumber: String!
      status: String!
      payload: JSON!
      assignedOfficerSubject: String
      assignedTeam: String
      lastTouchedBy: String
      lastTouchedAt: String
      createdAt: String!
      updatedAt: String!
    }

    type SupportingDocument {
      id: ID!
      category: String!
      fileName: String!
      mimeType: String!
      sizeBytes: Int!
      uploadStatus: String!
      scanStatus: String!
      createdAt: String!
      updatedAt: String!
    }

    type PageInfo {
      page: Int!
      pageSize: Int!
      totalItems: Int!
      totalPages: Int!
    }

    type ServiceRequestStatusCount {
      status: String!
      count: Int!
    }

    type ServiceRequestConnection {
      items: [ServiceRequest!]!
      pageInfo: PageInfo!
      statusCounts: [ServiceRequestStatusCount!]!
    }

    type ServiceRequestDraft {
      id: ID!
      customerId: ID!
      transactionDefinitionId: ID!
      transactionKey: String
      currentStep: String!
      payload: JSON!
      createdAt: String!
      updatedAt: String!
    }

    type SubmissionSummary {
      id: ID!
      serviceRequestId: ID!
      summaryFormat: String!
      contentType: String!
      fileName: String!
      summaryPayload: JSON!
      createdAt: String!
      updatedAt: String!
    }

    type DraftMutationError {
      code: String!
      message: String!
    }

    type FieldValidationError {
      field: String!
      message: String!
    }

    type ServiceRequestDraftMutationResult {
      ok: Boolean!
      draft: ServiceRequestDraft
      error: DraftMutationError
    }

    type SubmitServiceRequestMutationResult {
      ok: Boolean!
      serviceRequest: ServiceRequest
      error: DraftMutationError
      fieldErrors: [FieldValidationError!]!
      validationErrors: JSON!
    }

    type ServiceRequestStatusMutationResult {
      ok: Boolean!
      serviceRequest: ServiceRequest
      error: DraftMutationError
    }

    type ServiceRequestBatchStatusItem {
      ok: Boolean!
      referenceNumber: String!
      serviceRequest: ServiceRequest
      error: DraftMutationError
    }

    type ServiceRequestBatchStatusMutationResult {
      ok: Boolean!
      results: [ServiceRequestBatchStatusItem!]!
      error: DraftMutationError
    }

    type ServiceRequestConnectionResult {
      ok: Boolean!
      connection: ServiceRequestConnection
      error: DraftMutationError
    }

    input CreateServiceRequestDraftInput {
      transactionKey: String!
      currentStep: String!
      payload: JSON
    }

    input UpdateServiceRequestDraftInput {
      draftId: ID!
      currentStep: String!
      payload: JSON!
    }

    input SubmitServiceRequestInput {
      draftId: ID!
    }

    input UpdateServiceRequestStatusInput {
      referenceNumber: String!
      status: String!
      reason: String
    }

    input BatchUpdateServiceRequestStatusInput {
      referenceNumbers: [String!]!
      status: String!
      reason: String
    }

    input AssignServiceRequestInput {
      referenceNumber: String!
      assignedOfficerSubject: String
      assignedTeam: String
      reason: String
    }

    input ServiceRequestListInput {
      status: String
      search: String
      page: Int
      pageSize: Int
      sortBy: String
      sortDirection: String
    }

    type ActivityLog {
      id: ID!
      serviceRequestId: ID!
      eventType: String!
      eventPayload: JSON!
      createdAt: String!
    }

    type PlatformInfo {
      correlationId: String!
      demoRole: String!
      demoSubject: String!
    }

    type Query {
      platform: PlatformInfo!
      viewer: Viewer
      customerProfile: CustomerProfile
      featureFlags: [FeatureFlag!]!
      transactionDefinitions: [TransactionDefinition!]!
      transactionCatalogue: [TransactionCatalogueEntry!]!
      transactionSchema(transactionKey: String!): TransactionSchema
      serviceRequestDrafts: [ServiceRequestDraft!]!
      serviceRequestDraft(id: ID!): ServiceRequestDraft
      serviceRequests: [ServiceRequest!]!
      submittedServiceRequests: [ServiceRequest!]!
      serviceRequestConnection(input: ServiceRequestListInput): ServiceRequestConnectionResult!
      submittedServiceRequestConnection(input: ServiceRequestListInput): ServiceRequestConnectionResult!
      serviceRequest(referenceNumber: String!): ServiceRequest
      submissionSummary(referenceNumber: String!): SubmissionSummary
      supportingDocuments(referenceNumber: String, draftId: ID): [SupportingDocument!]!
      customerProfileEvidence(serviceRequestId: ID!): [CustomerProfileEvidence!]!
      activityLogs(serviceRequestId: ID!): [ActivityLog!]!
    }

    type Mutation {
      createServiceRequestDraft(input: CreateServiceRequestDraftInput!): ServiceRequestDraftMutationResult!
      updateServiceRequestDraft(input: UpdateServiceRequestDraftInput!): ServiceRequestDraftMutationResult!
      submitServiceRequest(input: SubmitServiceRequestInput!): SubmitServiceRequestMutationResult!
      updateServiceRequestStatus(input: UpdateServiceRequestStatusInput!): ServiceRequestStatusMutationResult!
      batchUpdateServiceRequestStatus(input: BatchUpdateServiceRequestStatusInput!): ServiceRequestBatchStatusMutationResult!
      assignServiceRequest(input: AssignServiceRequestInput!): ServiceRequestStatusMutationResult!
    }
  `,
  resolvers: {
    JSON: jsonScalar,
    CustomerProfile: {
      async attributes(parent: { customer: CustomerRecord }, _args: unknown, context: GraphqlContext) {
        const attributes = await context.repository.listCustomerProfileAttributes(parent.customer.id);

        return attributes.map((attribute) => ({
          id: attribute.id,
          key: attribute.attributeKey,
          value: attribute.attributeValue
        }));
      },
      async serviceRequests(parent: { customer: CustomerRecord }, _args: unknown, context: GraphqlContext) {
        return context.repository.listServiceRequestsForCustomer(parent.customer.id);
      }
    },
    FeatureFlag: {
      key(parent: { flagKey: string }) {
        return parent.flagKey;
      }
    },
    TransactionDefinition: {
      key(parent: { transactionKey: string }) {
        return parent.transactionKey;
      }
    },
    TransactionCatalogueEntry: {
      definition(parent: Record<string, unknown>) {
        return parent;
      }
    },
    Query: {
      platform(_parent: unknown, _args: unknown, context: GraphqlContext) {
        return {
          correlationId: context.correlationId,
          demoRole: context.demoIdentity.role,
          demoSubject: context.demoIdentity.subject
        };
      },
      viewer(_parent: unknown, _args: unknown, context: GraphqlContext) {
        return isCitizen(context.demoIdentity)
          ? context.repository.getCustomerByEmail(context.demoIdentity.subject)
          : null;
      },
      async customerProfile(_parent: unknown, _args: unknown, context: GraphqlContext) {
        if (!isCitizen(context.demoIdentity)) {
          return null;
        }

        const customer = await context.repository.getCustomerByEmail(context.demoIdentity.subject);

        return customer ? { customer } : null;
      },
      featureFlags(_parent: unknown, _args: unknown, context: GraphqlContext) {
        return context.repository.listFeatureFlags();
      },
      transactionDefinitions(_parent: unknown, _args: unknown, context: GraphqlContext) {
        return context.repository.listTransactionDefinitions();
      },
      transactionCatalogue(_parent: unknown, _args: unknown, context: GraphqlContext) {
        return context.transactionCatalogue.listEnabledTransactions();
      },
      async transactionSchema(
        _parent: unknown,
        args: { transactionKey: string },
        context: GraphqlContext
      ) {
        const result = await context.transactionCatalogue.getStartableTransaction(args.transactionKey);

        if (!result.ok) {
          return null;
        }

        return {
          transactionKey: result.transaction.transactionKey,
          schemaVersion: result.transaction.schemaVersion,
          schema: result.transaction.schema
        };
      },
      async serviceRequests(_parent: unknown, _args: unknown, context: GraphqlContext) {
        if (!isCitizen(context.demoIdentity)) {
          return [];
        }

        const customer = await context.repository.getCustomerByEmail(context.demoIdentity.subject);

        return customer ? context.repository.listServiceRequestsForCustomer(customer.id) : [];
      },
      submittedServiceRequests(_parent: unknown, _args: unknown, context: GraphqlContext) {
        return canReadSubmittedRecords(context.demoIdentity)
          ? context.repository.listSubmittedServiceRequests()
          : [];
      },
      async serviceRequestConnection(
        _parent: unknown,
        args: { input?: ServiceRequestListQueryInput | null },
        context: GraphqlContext
      ) {
        const parsed = parseServiceRequestListInput(args.input);

        if (!parsed.ok) {
          return serviceRequestConnectionError(parsed.code, parsed.message);
        }

        if (!isCitizen(context.demoIdentity)) {
          return serviceRequestConnectionSuccess(emptyServiceRequestConnection(parsed.input));
        }

        const customer = await context.repository.getCustomerByEmail(context.demoIdentity.subject);

        return serviceRequestConnectionSuccess(customer
          ? await context.repository.listServiceRequestConnection({
              ...parsed.input,
              customerId: customer.id
            })
          : emptyServiceRequestConnection(parsed.input));
      },
      async submittedServiceRequestConnection(
        _parent: unknown,
        args: { input?: ServiceRequestListQueryInput | null },
        context: GraphqlContext
      ) {
        const parsed = parseServiceRequestListInput(args.input);

        if (!parsed.ok) {
          return serviceRequestConnectionError(parsed.code, parsed.message);
        }

        if (!canReadSubmittedRecords(context.demoIdentity)) {
          return serviceRequestConnectionSuccess(emptyServiceRequestConnection(parsed.input));
        }

        return serviceRequestConnectionSuccess(await context.repository.listServiceRequestConnection({
          ...parsed.input,
          submittedOnly: true
        }));
      },
      async serviceRequestDrafts(_parent: unknown, _args: unknown, context: GraphqlContext) {
        if (!isCitizen(context.demoIdentity)) {
          return [];
        }

        const customer = await context.repository.getCustomerByEmail(context.demoIdentity.subject);

        return customer ? context.repository.listServiceRequestDraftsForCustomer(customer.id) : [];
      },
      async serviceRequestDraft(_parent: unknown, args: { id: string }, context: GraphqlContext) {
        if (!isCitizen(context.demoIdentity)) {
          return null;
        }

        const customer = await context.repository.getCustomerByEmail(context.demoIdentity.subject);

        return customer
          ? context.repository.getServiceRequestDraftForCustomer({
              draftId: args.id,
              customerId: customer.id
            })
          : null;
      },
      async serviceRequest(_parent: unknown, args: { referenceNumber: string }, context: GraphqlContext) {
        if (canReadSubmittedRecords(context.demoIdentity)) {
          const serviceRequest = await context.repository.getServiceRequestByReference(args.referenceNumber);

          if (serviceRequest && serviceRequest.status !== "DRAFT") {
            await context.repository.createServiceRequestEvent({
              serviceRequestId: serviceRequest.id,
              eventType: "SERVICE_REQUEST_DETAIL_VIEWED",
              eventPayload: {
                actorRole: context.demoIdentity.role,
                actorSubject: context.demoIdentity.subject,
                correlationId: context.correlationId,
                referenceNumber: serviceRequest.referenceNumber
              }
            });
          }

          return serviceRequest;
        }

        const customer = await context.repository.getCustomerByEmail(context.demoIdentity.subject);

        return customer
          ? context.repository.getServiceRequestByReferenceForCustomer({
              customerId: customer.id,
              referenceNumber: args.referenceNumber
            })
          : null;
      },
      async submissionSummary(_parent: unknown, args: { referenceNumber: string }, context: GraphqlContext) {
        if (!isCitizen(context.demoIdentity)) {
          return null;
        }

        const customer = await context.repository.getCustomerByEmail(context.demoIdentity.subject);

        return customer
          ? context.repository.getSubmissionSummaryForCustomerByReference({
              customerId: customer.id,
              referenceNumber: args.referenceNumber
            })
          : null;
      },
      async supportingDocuments(
        _parent: unknown,
        args: { referenceNumber?: string | null; draftId?: string | null },
        context: GraphqlContext
      ) {
        if (!isCitizen(context.demoIdentity)) {
          return [];
        }

        const customer = await context.repository.getCustomerByEmail(context.demoIdentity.subject);

        if (!customer) {
          return [];
        }

        if (args.referenceNumber) {
          const serviceRequest = await context.repository.getServiceRequestByReferenceForCustomer({
            customerId: customer.id,
            referenceNumber: args.referenceNumber
          });

          return serviceRequest
            ? context.repository.listSupportingDocumentsForCustomer({
                customerId: customer.id,
                serviceRequestId: serviceRequest.id
              })
            : [];
        }

        if (args.draftId) {
          const draft = await context.repository.getServiceRequestDraftForCustomer({
            customerId: customer.id,
            draftId: args.draftId
          });

          return draft
            ? context.repository.listSupportingDocumentsForCustomer({
                customerId: customer.id,
                serviceRequestDraftId: draft.id
              })
            : [];
        }

        return [];
      },
      customerProfileEvidence(_parent: unknown, args: { serviceRequestId: string }, context: GraphqlContext) {
        return context.repository.listCustomerProfileEvidence(args.serviceRequestId);
      },
      activityLogs(_parent: unknown, args: { serviceRequestId: string }, context: GraphqlContext) {
        return context.repository.listActivityLogs(args.serviceRequestId);
      }
    },
    Mutation: {
      async createServiceRequestDraft(
        _parent: unknown,
        args: { input: { transactionKey: string; currentStep: string; payload?: Record<string, unknown> | null } },
        context: GraphqlContext
      ) {
        if (!isCitizen(context.demoIdentity)) {
          return draftMutationError("FORBIDDEN", "Role cannot manage citizen drafts.");
        }

        const customer = await context.repository.getCustomerByEmail(context.demoIdentity.subject);

        if (!customer) {
          return draftMutationError("CUSTOMER_NOT_FOUND", "Customer was not found.");
        }

        const result = await context.draftLifecycle.createDraft({
          customerId: customer.id,
          transactionKey: args.input.transactionKey,
          currentStep: args.input.currentStep,
          payload: args.input.payload ?? {}
        });

        return result.ok ? draftMutationSuccess(result.draft) : draftMutationError(result.code, result.message);
      },
      async updateServiceRequestDraft(
        _parent: unknown,
        args: { input: { draftId: string; currentStep: string; payload: Record<string, unknown> } },
        context: GraphqlContext
      ) {
        if (!isCitizen(context.demoIdentity)) {
          return draftMutationError("FORBIDDEN", "Role cannot manage citizen drafts.");
        }

        const customer = await context.repository.getCustomerByEmail(context.demoIdentity.subject);

        if (!customer) {
          return draftMutationError("CUSTOMER_NOT_FOUND", "Customer was not found.");
        }

        const result = await context.draftLifecycle.updateDraft({
          draftId: args.input.draftId,
          customerId: customer.id,
          currentStep: args.input.currentStep,
          payload: args.input.payload
        });

        return result.ok ? draftMutationSuccess(result.draft) : draftMutationError(result.code, result.message);
      },
      async submitServiceRequest(
        _parent: unknown,
        args: { input: { draftId: string } },
        context: GraphqlContext
      ) {
        if (!isCitizen(context.demoIdentity)) {
          return submitMutationError("FORBIDDEN", "Role cannot submit citizen drafts.", []);
        }

        const customer = await context.repository.getCustomerByEmail(context.demoIdentity.subject);

        if (!customer) {
          return submitMutationError("CUSTOMER_NOT_FOUND", "Customer was not found.", []);
        }

        const result = await context.submissionLifecycle.submitDraft({
          customerId: customer.id,
          draftId: args.input.draftId,
          correlationId: context.correlationId
        });

        return result.ok
          ? submitMutationSuccess(result.serviceRequest)
          : submitMutationError(result.code, result.message, result.fieldErrors);
      },
      async updateServiceRequestStatus(
        _parent: unknown,
        args: { input: { referenceNumber: string; status: string; reason?: string | null } },
        context: GraphqlContext
      ) {
        if (!canReadSubmittedRecords(context.demoIdentity)) {
          return statusMutationError("FORBIDDEN", "Role cannot update service request status.");
        }

        const serviceRequest = await context.repository.getServiceRequestByReference(args.input.referenceNumber);

        if (!isServiceRequestStatus(args.input.status)) {
          return statusMutationError("INVALID_STATUS", "Status is not supported.");
        }

        if (!serviceRequest) {
          return statusMutationError("SERVICE_REQUEST_NOT_FOUND", "Service request was not found.");
        }

        const result = await context.serviceRequestStatusLifecycle.transitionStatus({
          actorRole: context.demoIdentity.role,
          actorSubject: context.demoIdentity.subject,
          customerId: serviceRequest.customerId,
          referenceNumber: args.input.referenceNumber,
          nextStatus: args.input.status,
          reason: args.input.reason ?? undefined,
          correlationId: context.correlationId
        });

        return result.ok
          ? statusMutationSuccess(result.serviceRequest)
          : statusMutationError(result.code, result.message);
      },
      async batchUpdateServiceRequestStatus(
        _parent: unknown,
        args: { input: { referenceNumbers: string[]; status: string; reason?: string | null } },
        context: GraphqlContext
      ) {
        if (!canReadSubmittedRecords(context.demoIdentity)) {
          return batchStatusMutationError("FORBIDDEN", "Role cannot update service request status.");
        }

        if (!isServiceRequestStatus(args.input.status)) {
          return batchStatusMutationError("INVALID_STATUS", "Status is not supported.");
        }

        const referenceNumbers = args.input.referenceNumbers.map((referenceNumber) => referenceNumber.trim()).filter(Boolean);

        if (referenceNumbers.length === 0) {
          return batchStatusMutationError("INVALID_REFERENCE_NUMBERS", "At least one reference number is required.");
        }

        const result = await context.serviceRequestStatusLifecycle.batchTransitionStatus({
          actorRole: context.demoIdentity.role,
          actorSubject: context.demoIdentity.subject,
          correlationId: context.correlationId,
          nextStatus: args.input.status,
          reason: args.input.reason ?? undefined,
          referenceNumbers
        });

        return batchStatusMutationFromResult(result);
      },
      async assignServiceRequest(
        _parent: unknown,
        args: {
          input: {
            assignedOfficerSubject?: string | null;
            assignedTeam?: string | null;
            reason?: string | null;
            referenceNumber: string;
          };
        },
        context: GraphqlContext
      ) {
        const result = await context.serviceRequestStatusLifecycle.assignRequest({
          actorRole: context.demoIdentity.role,
          actorSubject: context.demoIdentity.subject,
          assignedOfficerSubject: args.input.assignedOfficerSubject,
          assignedTeam: args.input.assignedTeam,
          correlationId: context.correlationId,
          reason: args.input.reason ?? undefined,
          referenceNumber: args.input.referenceNumber
        });

        return result.ok
          ? statusMutationSuccess(result.serviceRequest)
          : statusMutationError(result.code, result.message);
      }
    }
  }
});

function draftMutationSuccess(draft: unknown) {
  return {
    ok: true,
    draft,
    error: null
  };
}

function draftMutationError(code: string, message: string) {
  return {
    ok: false,
    draft: null,
    error: {
      code,
      message
    }
  };
}

function submitMutationSuccess(serviceRequest: unknown) {
  return {
    ok: true,
    serviceRequest,
    error: null,
    fieldErrors: [],
    validationErrors: {}
  };
}

function submitMutationError(
  code: string,
  message: string,
  fieldErrors: Array<{ field: string; message: string }>
) {
  return {
    ok: false,
    serviceRequest: null,
    error: {
      code,
      message
    },
    fieldErrors,
    validationErrors: Object.fromEntries(fieldErrors.map((error) => [error.field, error.message]))
  };
}

function statusMutationSuccess(serviceRequest: unknown) {
  return {
    ok: true,
    serviceRequest,
    error: null
  };
}

function statusMutationError(code: string, message: string) {
  return {
    ok: false,
    serviceRequest: null,
    error: {
      code,
      message
    }
  };
}

function batchStatusMutationFromResult(result: ServiceRequestBatchStatusLifecycleResult) {
  return {
    ok: result.ok,
    results: result.results.map((item) => item.ok
      ? {
          ok: true,
          referenceNumber: item.referenceNumber,
          serviceRequest: item.serviceRequest,
          error: null
        }
      : {
          ok: false,
          referenceNumber: item.referenceNumber,
          serviceRequest: null,
          error: item.error
        }),
    error: result.ok
      ? null
      : {
          code: "PARTIAL_FAILURE",
          message: "One or more service request status updates failed."
        }
  };
}

function batchStatusMutationError(code: string, message: string) {
  return {
    ok: false,
    results: [],
    error: {
      code,
      message
    }
  };
}

function serviceRequestConnectionSuccess(connection: unknown) {
  return {
    ok: true,
    connection,
    error: null
  };
}

function serviceRequestConnectionError(code: string, message: string) {
  return {
    ok: false,
    connection: null,
    error: {
      code,
      message
    }
  };
}

function parseServiceRequestListInput(input?: ServiceRequestListQueryInput | null):
  | { ok: true; input: ServiceRequestListInput }
  | { ok: false; code: string; message: string } {
  const page = input?.page ?? 1;
  const pageSize = input?.pageSize ?? 20;
  const sortBy = input?.sortBy ?? "createdAt";
  const sortDirection = (input?.sortDirection ?? "DESC").toUpperCase();
  const search = input?.search?.trim();
  const status = input?.status ?? undefined;

  if (!Number.isInteger(page) || page < 1) {
    return { ok: false, code: "INVALID_PAGE", message: "Page must be a positive integer." };
  }

  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50) {
    return { ok: false, code: "INVALID_PAGE_SIZE", message: "Page size must be between 1 and 50." };
  }

  if (!isServiceRequestSortBy(sortBy)) {
    return { ok: false, code: "INVALID_SORT", message: "Sort field is not supported." };
  }

  if (!isServiceRequestSortDirection(sortDirection)) {
    return { ok: false, code: "INVALID_SORT_DIRECTION", message: "Sort direction is not supported." };
  }

  if (status && !isServiceRequestStatus(status)) {
    return { ok: false, code: "INVALID_STATUS", message: "Status is not supported." };
  }

  const validatedStatus = status && isServiceRequestStatus(status) ? status : undefined;

  return {
    ok: true,
    input: {
      page,
      pageSize,
      sortBy,
      sortDirection,
      ...(validatedStatus ? { status: validatedStatus } : {}),
      ...(search ? { search } : {})
    }
  };
}

function emptyServiceRequestConnection(input: ServiceRequestListInput) {
  return {
    items: [],
    pageInfo: {
      page: input.page,
      pageSize: input.pageSize,
      totalItems: 0,
      totalPages: 0
    },
    statusCounts: []
  };
}

function isServiceRequestStatus(status: string): status is "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "ACTION_REQUIRED" | "COMPLETED" | "WITHDRAWN" {
  return ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "ACTION_REQUIRED", "COMPLETED", "WITHDRAWN"].includes(status);
}

function isServiceRequestSortBy(sortBy: string): sortBy is ServiceRequestListInput["sortBy"] {
  return [
    "assignedOfficer",
    "assignedTeam",
    "createdAt",
    "lastTouchedAt",
    "referenceNumber",
    "status",
    "transactionKey"
  ].includes(sortBy);
}

function isServiceRequestSortDirection(direction: string): direction is ServiceRequestListInput["sortDirection"] {
  return direction === "ASC" || direction === "DESC";
}
