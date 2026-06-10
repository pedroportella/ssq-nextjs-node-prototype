import { loadConfig } from "../config.js";
import { createDatabaseClient } from "./client.js";
import { applyMigration } from "./migrations.js";
import { readSqlFiles } from "./sqlFiles.js";

const config = loadConfig();
const database = createDatabaseClient(config);

try {
  const migrations = await readSqlFiles("migrations");

  for (const migration of migrations) {
    await applyMigration(database.queryable, migration.name, migration.sql);
    console.log(`Applied migration ${migration.name}`);
  }
} finally {
  await database.close();
}
