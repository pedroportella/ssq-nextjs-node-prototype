import { GraphQLScalarType, Kind } from "graphql";
import { createSchema } from "graphql-yoga";

import { canReadSubmittedRecords, isCitizen } from "../auth/demoIdentity.js";

import type { GraphqlContext } from "./context.js";
import type { CustomerRecord } from "../repositories/prototypeRepository.js";

type JsonValue = boolean | number | string | null | JsonValue[] | { [key: string]: JsonValue };

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
      serviceRequest(referenceNumber: String!): ServiceRequest
      submissionSummary(referenceNumber: String!): SubmissionSummary
      customerProfileEvidence(serviceRequestId: ID!): [CustomerProfileEvidence!]!
      activityLogs(serviceRequestId: ID!): [ActivityLog!]!
    }

    type Mutation {
      createServiceRequestDraft(input: CreateServiceRequestDraftInput!): ServiceRequestDraftMutationResult!
      updateServiceRequestDraft(input: UpdateServiceRequestDraftInput!): ServiceRequestDraftMutationResult!
      submitServiceRequest(input: SubmitServiceRequestInput!): SubmitServiceRequestMutationResult!
      updateServiceRequestStatus(input: UpdateServiceRequestStatusInput!): ServiceRequestStatusMutationResult!
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
          return context.repository.getServiceRequestByReference(args.referenceNumber);
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
          customerId: serviceRequest.customerId,
          referenceNumber: args.input.referenceNumber,
          nextStatus: args.input.status,
          reason: args.input.reason ?? undefined,
          correlationId: context.correlationId
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

function isServiceRequestStatus(status: string): status is "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "ACTION_REQUIRED" | "COMPLETED" | "WITHDRAWN" {
  return ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "ACTION_REQUIRED", "COMPLETED", "WITHDRAWN"].includes(status);
}
