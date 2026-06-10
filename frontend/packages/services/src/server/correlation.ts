import "server-only";

import { randomUUID } from "node:crypto";

export const CORRELATION_HEADER = "x-correlation-id";

export function createCorrelationId(): string {
  return randomUUID();
}

export function createBackendHeaders(correlationId = createCorrelationId()): Headers {
  return new Headers({
    [CORRELATION_HEADER]: correlationId,
    "content-type": "application/json"
  });
}
