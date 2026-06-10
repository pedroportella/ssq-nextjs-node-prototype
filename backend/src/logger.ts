import type { AppConfig } from "./config.js";

export function createLoggerOptions(config: Pick<AppConfig, "LOG_LEVEL" | "NODE_ENV">) {
  if (config.NODE_ENV === "test") {
    return false;
  }

  return {
    level: config.LOG_LEVEL,
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "req.headers['x-api-key']",
        "request.headers.authorization",
        "request.headers.cookie",
        "payload",
        "body"
      ],
      censor: "[redacted]"
    }
  };
}
