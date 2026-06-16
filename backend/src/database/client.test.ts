import { describe, expect, it } from "vitest";

import { createPostgresPoolConfig } from "./client.js";

describe("Postgres database client config", () => {
  it("keeps local PostgreSQL connections non-SSL by default", () => {
    expect(createPostgresPoolConfig("postgresql://ssq_app:ssq_dev_password@localhost:54329/ssq_prototype")).toMatchObject({
      ssl: false
    });
  });

  it("allows DigitalOcean-style sslmode=require connections with self-signed chains", () => {
    expect(
      createPostgresPoolConfig("postgresql://user:password@db.example.test:25060/defaultdb?sslmode=require")
    ).toMatchObject({
      connectionString: "postgresql://user:password@db.example.test:25060/defaultdb",
      ssl: {
        rejectUnauthorized: false
      }
    });
  });

  it("preserves strict SSL verification when explicitly requested", () => {
    expect(createPostgresPoolConfig("postgresql://user:password@db.example.test/defaultdb?sslmode=verify-full")).toMatchObject({
      connectionString: "postgresql://user:password@db.example.test/defaultdb",
      ssl: true
    });
  });
});
