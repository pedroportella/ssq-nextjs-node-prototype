import { randomUUID } from "node:crypto";

import {
  CORRELATION_HEADER,
  DEMO_CUSTOMER_EMAIL_HEADER,
  DEMO_ROLE_HEADER,
  DEMO_SUBJECT_HEADER,
  resolveDemoIdentity
} from "../auth/demoIdentity.js";
import { PrototypeRepository } from "../repositories/prototypeRepository.js";
import { DraftLifecycleService } from "../services/draftLifecycleService.js";
import { ServiceRequestStatusLifecycleService } from "../services/serviceRequestStatusLifecycleService.js";
import { SubmissionLifecycleService } from "../services/submissionLifecycleService.js";
import { TransactionCatalogueService } from "../services/transactionCatalogueService.js";

import type { Queryable } from "../database/types.js";
import type { DemoIdentity } from "../auth/demoIdentity.js";

export interface GraphqlContext {
  correlationId: string;
  demoIdentity: DemoIdentity;
  repository: PrototypeRepository;
  draftLifecycle: DraftLifecycleService;
  serviceRequestStatusLifecycle: ServiceRequestStatusLifecycleService;
  submissionLifecycle: SubmissionLifecycleService;
  transactionCatalogue: TransactionCatalogueService;
}

export function createGraphqlContext(input: {
  headers: Headers;
  queryable: Queryable;
}): GraphqlContext {
  const repository = new PrototypeRepository(input.queryable);
  const transactionCatalogue = new TransactionCatalogueService(repository);
  const correlationId = input.headers.get(CORRELATION_HEADER) ?? randomUUID();
  const demoIdentity = resolveDemoIdentity({
    roleHeader: input.headers.get(DEMO_ROLE_HEADER),
    subjectHeader: input.headers.get(DEMO_SUBJECT_HEADER),
    legacyCustomerEmailHeader: input.headers.get(DEMO_CUSTOMER_EMAIL_HEADER)
  });

  return {
    correlationId,
    demoIdentity,
    draftLifecycle: new DraftLifecycleService(repository, transactionCatalogue),
    repository,
    serviceRequestStatusLifecycle: new ServiceRequestStatusLifecycleService(repository),
    submissionLifecycle: new SubmissionLifecycleService(repository, transactionCatalogue),
    transactionCatalogue
  };
}
