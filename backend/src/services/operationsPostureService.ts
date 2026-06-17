import { readSqlFiles } from "../database/sqlFiles.js";
import { OutboxEventService, type OperationsOutboxSummary } from "./outboxEventService.js";

import type { AppConfig } from "../config.js";
import type { Queryable } from "../database/types.js";
import type { FeatureFlagRecord, PrototypeRepository } from "../repositories/prototypeRepository.js";

type PostureStatus = "READY" | "DEGRADED" | "DOWN";
type SignalStatus = "OK" | "WARN" | "FAIL";

export interface OperationsPosture {
  generatedAt: string;
  status: PostureStatus;
  service: {
    name: string;
    version: string;
    environment: AppConfig["NODE_ENV"];
  };
  signals: {
    runtime: {
      status: "OK";
    };
    database: {
      status: SignalStatus;
    };
    outbox: {
      status: SignalStatus;
      summary?: OperationsOutboxSummary;
      error?: string;
    };
    featureFlags: {
      status: SignalStatus;
      enabled: number;
      disabled: number;
      flags: Array<{
        key: string;
        enabled: boolean;
      }>;
      error?: string;
    };
    migrations: {
      status: SignalStatus;
      latestAvailable?: string;
      latestApplied?: string;
      appliedCount?: number;
      availableCount?: number;
      error?: string;
    };
    hardening: {
      status: SignalStatus;
      corsAllowedOrigins: number;
      debugRoutesEnabled: boolean;
      rateLimitEnabled: boolean;
      rateLimitMax: number;
      rateLimitWindowMs: number;
      hstsEnabled: boolean;
    };
    seededData: {
      status: SignalStatus;
      latestAvailableSeed?: string;
      seedFileCount?: number;
      error?: string;
    };
  };
  nextActions: Array<{
    code: string;
    severity: "INFO" | "WARN" | "CRITICAL";
    message: string;
  }>;
}

export class OperationsPostureService {
  constructor(
    private readonly input: {
      config: AppConfig;
      database: { ping(): Promise<boolean> };
      queryable: Queryable;
      repository: PrototypeRepository;
    }
  ) {}

  async getPosture(): Promise<OperationsPosture> {
    const databaseUp = await this.input.database.ping();
    const [outbox, featureFlags, migrations, seededData] = databaseUp
      ? await Promise.all([
          this.readOutboxSignal(),
          this.readFeatureFlagSignal(),
          this.readMigrationSignal(),
          this.readSeededDataSignal()
        ])
      : [
          {
            status: "FAIL" as const,
            error: "Database readiness check failed."
          },
          {
            status: "FAIL" as const,
            enabled: 0,
            disabled: 0,
            flags: [],
            error: "Database readiness check failed."
          },
          await this.readMigrationSignal({
            skipAppliedVersions: true
          }),
          await this.readSeededDataSignal()
        ];
    const hardening = this.createHardeningSignal();
    const signals: OperationsPosture["signals"] = {
      runtime: {
        status: "OK"
      },
      database: {
        status: databaseUp ? "OK" : "FAIL"
      },
      outbox,
      featureFlags,
      migrations,
      hardening,
      seededData
    };
    const nextActions = deriveNextActions(signals);

    return {
      generatedAt: new Date().toISOString(),
      status: derivePostureStatus(signals),
      service: {
        name: this.input.config.APP_NAME,
        version: this.input.config.APP_VERSION,
        environment: this.input.config.NODE_ENV
      },
      signals,
      nextActions
    };
  }

  private async readOutboxSignal(): Promise<OperationsPosture["signals"]["outbox"]> {
    try {
      const summary = await new OutboxEventService(this.input.repository).getOperationsSummary();

      return {
        status: summary.totals.failed > 0 ? "FAIL" : summary.totals.pending > 0 ? "WARN" : "OK",
        summary
      };
    } catch {
      return {
        status: "FAIL",
        error: "Outbox summary could not be read."
      };
    }
  }

  private async readFeatureFlagSignal(): Promise<OperationsPosture["signals"]["featureFlags"]> {
    try {
      const flags = await this.input.repository.listFeatureFlags();
      const enabled = flags.filter((flag) => flag.enabled).length;
      const disabled = flags.length - enabled;

      return {
        status: disabled > 0 ? "WARN" : "OK",
        enabled,
        disabled,
        flags: flags.map(mapFeatureFlag)
      };
    } catch {
      return {
        status: "FAIL",
        enabled: 0,
        disabled: 0,
        flags: [],
        error: "Feature flags could not be read."
      };
    }
  }

  private async readMigrationSignal(options: {
    skipAppliedVersions?: boolean;
  } = {}): Promise<OperationsPosture["signals"]["migrations"]> {
    try {
      const migrations = await readSqlFiles("migrations");
      const appliedVersions = options.skipAppliedVersions ? [] : await this.readAppliedMigrationVersions();
      const latestAvailable = migrations.at(-1)?.name;
      const latestApplied = appliedVersions.at(-1);

      return {
        status: latestAvailable && latestApplied && latestAvailable !== latestApplied ? "WARN" : options.skipAppliedVersions ? "WARN" : "OK",
        latestAvailable,
        latestApplied,
        appliedCount: appliedVersions.length,
        availableCount: migrations.length
      };
    } catch {
      return {
        status: "FAIL",
        error: "Migration posture could not be read."
      };
    }
  }

  private async readSeededDataSignal(): Promise<OperationsPosture["signals"]["seededData"]> {
    try {
      const seeds = await readSqlFiles("seeds");

      return {
        status: "OK",
        latestAvailableSeed: seeds.at(-1)?.name,
        seedFileCount: seeds.length
      };
    } catch {
      return {
        status: "WARN",
        error: "Seed file posture could not be read."
      };
    }
  }

  private async readAppliedMigrationVersions(): Promise<string[]> {
    const result = await this.input.queryable.query<{ version: string }>(
      `
        SELECT version
        FROM schema_migrations
        ORDER BY version ASC
      `
    );

    return result.rows.map((row) => row.version);
  }

  private createHardeningSignal(): OperationsPosture["signals"]["hardening"] {
    const config = this.input.config;
    const status = config.RATE_LIMIT_ENABLED && (config.NODE_ENV === "production" || !config.DEBUG_ROUTES_ENABLED)
      ? "OK"
      : "WARN";

    return {
      status,
      corsAllowedOrigins: config.CORS_ALLOWED_ORIGINS.length,
      debugRoutesEnabled: config.DEBUG_ROUTES_ENABLED,
      rateLimitEnabled: config.RATE_LIMIT_ENABLED,
      rateLimitMax: config.RATE_LIMIT_MAX,
      rateLimitWindowMs: config.RATE_LIMIT_WINDOW_MS,
      hstsEnabled: config.NODE_ENV === "production"
    };
  }
}

function mapFeatureFlag(flag: FeatureFlagRecord) {
  return {
    key: flag.flagKey,
    enabled: flag.enabled
  };
}

function derivePostureStatus(signals: OperationsPosture["signals"]): PostureStatus {
  if (signals.database.status === "FAIL") {
    return "DOWN";
  }

  return Object.values(signals).some((signal) => signal.status === "FAIL" || signal.status === "WARN")
    ? "DEGRADED"
    : "READY";
}

function deriveNextActions(signals: OperationsPosture["signals"]): OperationsPosture["nextActions"] {
  const actions: OperationsPosture["nextActions"] = [];

  if (signals.database.status === "FAIL") {
    actions.push({
      code: "DATABASE_DOWN",
      severity: "CRITICAL",
      message: "Restore database connectivity before running backend workflows."
    });
  }

  if (signals.outbox.summary?.totals.failed) {
    actions.push({
      code: "OUTBOX_FAILED",
      severity: "CRITICAL",
      message: "Inspect failed outbox handoff events before continuing operations."
    });
  }

  if (signals.outbox.summary?.totals.pending) {
    actions.push({
      code: "OUTBOX_PENDING",
      severity: "WARN",
      message: "Process or review pending outbox handoff events."
    });
  }

  if (signals.featureFlags.disabled > 0) {
    actions.push({
      code: "FEATURES_DISABLED",
      severity: "WARN",
      message: "Review disabled transaction feature flags before a broad demo."
    });
  }

  if (signals.migrations.latestAvailable && signals.migrations.latestApplied && signals.migrations.latestAvailable !== signals.migrations.latestApplied) {
    actions.push({
      code: "MIGRATIONS_NOT_CURRENT",
      severity: "WARN",
      message: "Run database migrations so the applied version matches the latest available migration."
    });
  }

  if (signals.hardening.debugRoutesEnabled) {
    actions.push({
      code: "DEBUG_ROUTES_ENABLED",
      severity: "WARN",
      message: "Disable debug routes before a shared or production-like review."
    });
  }

  if (!signals.hardening.rateLimitEnabled) {
    actions.push({
      code: "RATE_LIMIT_DISABLED",
      severity: "WARN",
      message: "Enable request rate limiting before external review."
    });
  }

  if (actions.length === 0) {
    actions.push({
      code: "NO_ACTION_REQUIRED",
      severity: "INFO",
      message: "No immediate operations action is required."
    });
  }

  return actions;
}
