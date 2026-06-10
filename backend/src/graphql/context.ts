import { randomUUID } from "node:crypto";

import { PrototypeRepository } from "../repositories/prototypeRepository.js";
import { TransactionCatalogueService } from "../services/transactionCatalogueService.js";

import type { Queryable } from "../database/types.js";

export const CORRELATION_HEADER = "x-correlation-id";
export const DEMO_CUSTOMER_EMAIL_HEADER = "x-demo-customer-email";
export const DEFAULT_DEMO_CUSTOMER_EMAIL = "demo.customer@example.test";

export interface GraphqlContext {
  correlationId: string;
  demoCustomerEmail: string;
  repository: PrototypeRepository;
  transactionCatalogue: TransactionCatalogueService;
}

export function createGraphqlContext(input: {
  headers: Headers;
  queryable: Queryable;
}): GraphqlContext {
  const repository = new PrototypeRepository(input.queryable);
  const correlationId = input.headers.get(CORRELATION_HEADER) ?? randomUUID();
  const demoCustomerEmail = input.headers.get(DEMO_CUSTOMER_EMAIL_HEADER) ?? DEFAULT_DEMO_CUSTOMER_EMAIL;

  return {
    correlationId,
    demoCustomerEmail,
    repository,
    transactionCatalogue: new TransactionCatalogueService(repository)
  };
}
