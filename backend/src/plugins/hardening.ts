import { getCorrelationId } from "./observability.js";

import type { FastifyInstance } from "fastify";
import type { AppConfig } from "../config.js";

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

export async function registerHardening(app: FastifyInstance, config: AppConfig) {
  const buckets = new Map<string, RateLimitBucket>();

  app.addHook("onRequest", async (request, reply) => {
    if (!config.RATE_LIMIT_ENABLED) {
      return;
    }

    const now = Date.now();
    const key = request.ip;
    const existing = buckets.get(key);
    const bucket = existing && existing.resetAt > now
      ? existing
      : {
          count: 0,
          resetAt: now + config.RATE_LIMIT_WINDOW_MS
        };

    bucket.count += 1;
    buckets.set(key, bucket);

    reply.header("x-ratelimit-limit", String(config.RATE_LIMIT_MAX));
    reply.header("x-ratelimit-remaining", String(Math.max(config.RATE_LIMIT_MAX - bucket.count, 0)));
    reply.header("x-ratelimit-reset", String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > config.RATE_LIMIT_MAX) {
      reply.code(429);

      return reply.send({
        ok: false,
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests.",
          correlationId: getCorrelationId(request)
        }
      });
    }
  });

  app.addHook("onSend", async (_request, reply, payload) => {
    reply.header("x-content-type-options", "nosniff");
    reply.header("x-frame-options", "DENY");
    reply.header("referrer-policy", "no-referrer");
    reply.header("permissions-policy", "camera=(), microphone=(), geolocation=()");

    if (config.NODE_ENV === "production") {
      reply.header("strict-transport-security", "max-age=31536000; includeSubDomains");
    }

    return payload;
  });
}
