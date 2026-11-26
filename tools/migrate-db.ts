import { readFile, readdir } from "node:fs/promises";
import type { Pool } from "pg";
export async function migrateDatabase(pool: Pool) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext(current_schema() || ':workflow-migrations'))",
    );
    await client.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations(version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
    );
    for (const version of (
      await readdir(new URL("../database/migrations/", import.meta.url))
    )
      .filter((name) => name.endsWith(".sql"))
      .sort()) {
      if (
        (
          await client.query(
            "SELECT 1 FROM schema_migrations WHERE version=$1",
            [version],
          )
        ).rowCount
      )
        continue;
      await client.query(
        await readFile(
          new URL(`../database/migrations/${version}`, import.meta.url),
          "utf8",
        ),
      );
      await client.query("INSERT INTO schema_migrations(version) VALUES($1)", [
        version,
      ]);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
