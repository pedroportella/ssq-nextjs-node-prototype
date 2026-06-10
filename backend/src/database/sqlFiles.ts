import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const backendRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export interface SqlFile {
  name: string;
  sql: string;
}

export async function readSqlFiles(directory: "migrations" | "seeds"): Promise<SqlFile[]> {
  const directoryPath = join(backendRoot, "database", directory);
  const filenames = (await readdir(directoryPath)).filter((filename) => filename.endsWith(".sql")).sort();

  return Promise.all(
    filenames.map(async (name) => ({
      name,
      sql: await readFile(join(directoryPath, name), "utf8")
    }))
  );
}
