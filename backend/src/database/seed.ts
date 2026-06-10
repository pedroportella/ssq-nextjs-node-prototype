import { loadConfig } from "../config.js";
import { createDatabaseClient } from "./client.js";
import { readSqlFiles } from "./sqlFiles.js";

const config = loadConfig();
const database = createDatabaseClient(config);

try {
  const seeds = await readSqlFiles("seeds");

  for (const seed of seeds) {
    await database.queryable.query(seed.sql);
    console.log(`Applied seed ${seed.name}`);
  }
} finally {
  await database.close();
}
