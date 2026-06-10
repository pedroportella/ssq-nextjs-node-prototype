import { randomUUID } from "node:crypto";

import { CORRELATION_HEADER, headerValue } from "../auth/demoIdentity.js";

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

const requestCorrelationIds = new WeakMap<FastifyRequest, string>();

export async function registerObservability(app: FastifyInstance) {
  app.addHook("onRequest", async (request) => {
    const correlationId = headerValue(request.headers[CORRELATION_HEADER]) ?? randomUUID();

    request.headers[CORRELATION_HEADER] = correlationId;
    requestCorrelationIds.set(request, correlationId);
    request.log.info({
      correlationId,
      method: request.method,
      url: request.url
    }, "request received");
  });

  app.addHook("onSend", async (request, reply, payload) => {
    reply.header(CORRELATION_HEADER, getCorrelationId(request));

    return payload;
  });

  app.setNotFoundHandler((request, reply) => {
    return sendProblem(reply, {
      statusCode: 404,
      code: "NOT_FOUND",
      message: "Route was not found.",
      correlationId: getCorrelationId(request)
    });
  });

  app.setErrorHandler((error, request, reply) => {
    const safeError = toSafeError(error);
    const statusCode = safeStatusCode(safeError.statusCode);
    const correlationId = getCorrelationId(request);

    request.log.error({
      correlationId,
      error: {
        name: safeError.name,
        message: safeError.message
      }
    }, "request failed");

    return sendProblem(reply, {
      statusCode,
      code: statusCode >= 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_FAILED",
      message: statusCode >= 500 ? "Internal server error." : "Request failed.",
      correlationId
    });
  });
}

export function getCorrelationId(request: FastifyRequest): string {
  return requestCorrelationIds.get(request) ?? headerValue(request.headers[CORRELATION_HEADER]) ?? randomUUID();
}

function sendProblem(reply: FastifyReply, input: {
  statusCode: number;
  code: string;
  message: string;
  correlationId: string;
}) {
  reply.code(input.statusCode);

  return {
    ok: false,
    error: {
      code: input.code,
      message: input.message,
      correlationId: input.correlationId
    }
  };
}

function safeStatusCode(statusCode: number | undefined): number {
  return statusCode && statusCode >= 400 && statusCode < 600 ? statusCode : 500;
}

function toSafeError(error: unknown): {
  name: string;
  message: string;
  statusCode?: number;
} {
  if (error instanceof Error) {
    const statusCode = (error as Error & { statusCode?: unknown }).statusCode;

    return {
      name: error.name,
      message: error.message,
      statusCode: typeof statusCode === "number" ? statusCode : undefined
    };
  }

  return {
    name: "UnknownError",
    message: "Unknown error."
  };
}
