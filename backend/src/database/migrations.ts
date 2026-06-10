import type { Queryable } from "./types.js";

export async function applyMigration(queryable: Queryable, version: string, sql: string) {
  await queryable.query("BEGIN");

  try {
    await queryable.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const existing = await queryable.query<{ version: string }>(
      "SELECT version FROM schema_migrations WHERE version = $1",
      [version]
    );

    if (existing.rowCount === 0) {
      await queryable.query(sql);
      await queryable.query("INSERT INTO schema_migrations (version) VALUES ($1)", [version]);
    }

    await queryable.query("COMMIT");
  } catch (error) {
    await queryable.query("ROLLBACK");
    throw error;
  }
}
