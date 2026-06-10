import { Pool } from "pg";

import type { AppConfig } from "../config.js";
import type { DatabaseHealthCheck, Queryable } from "./types.js";

export interface DatabaseClient extends DatabaseHealthCheck {
  queryable: Queryable;
  close(): Promise<void>;
}

export class UnavailableDatabaseClient implements DatabaseClient {
  queryable: Queryable = {
    async query() {
      throw new Error("Database connection is not configured.");
    }
  };

  async ping() {
    return false;
  }

  async close() {
    return;
  }
}

export class PostgresDatabaseClient implements DatabaseClient {
  readonly pool: Pool;
  readonly queryable: Queryable;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      max: 10,
      ssl: false
    });
    this.queryable = this.pool;
  }

  async ping() {
    try {
      await this.pool.query("SELECT 1");
      return true;
    } catch {
      return false;
    }
  }

  async close() {
    await this.pool.end();
  }
}

export function createDatabaseClient(config: AppConfig): DatabaseClient {
  if (!config.DATABASE_URL) {
    return new UnavailableDatabaseClient();
  }

  return new PostgresDatabaseClient(config.DATABASE_URL);
}
