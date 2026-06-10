import "server-only";

import { createBackendHeaders, createCorrelationId } from "./correlation";

export interface BackendClientConfig {
  backendUrl: string;
}

export interface BackendGraphqlRequest<TVariables extends Record<string, unknown> = Record<string, never>> {
  operationName?: string;
  query: string;
  variables?: TVariables;
}

export interface BackendGraphqlResponse<TData> {
  correlationId: string;
  data?: TData;
  errors?: Array<{
    message: string;
    path?: Array<string | number>;
  }>;
}

export class BackendClientError extends Error {
  constructor(
    message: string,
    public readonly correlationId: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "BackendClientError";
  }
}

export function loadBackendClientConfig(env: NodeJS.ProcessEnv = process.env): BackendClientConfig {
  const backendUrl = env.BACKEND_INTERNAL_URL;

  if (!backendUrl) {
    throw new BackendClientError("Backend service URL is not configured.", createCorrelationId());
  }

  return {
    backendUrl: backendUrl.replace(/\/$/, "")
  };
}

export async function executeBackendGraphql<TData, TVariables extends Record<string, unknown> = Record<string, never>>(
  request: BackendGraphqlRequest<TVariables>,
  options: {
    config?: BackendClientConfig;
    fetchImpl?: typeof fetch;
  } = {}
): Promise<BackendGraphqlResponse<TData>> {
  const config = options.config ?? loadBackendClientConfig();
  const correlationId = createCorrelationId();
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(`${config.backendUrl}/graphql`, {
    body: JSON.stringify(request),
    cache: "no-store",
    headers: createBackendHeaders(correlationId),
    method: "POST"
  });

  if (!response.ok) {
    throw new BackendClientError("Backend GraphQL request failed.", correlationId, response.status);
  }

  const payload = (await response.json()) as Omit<BackendGraphqlResponse<TData>, "correlationId">;

  return {
    correlationId,
    ...payload
  };
}
