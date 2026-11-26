import pg, { type PoolClient, type QueryResultRow } from "pg";
import { createError } from "h3";
import { assertDatabaseConfig } from "./config";

const schema = process.env.WORKFLOW_DB_SCHEMA ?? "public";
if (!/^[a-z][a-z0-9_]*$/.test(schema))
  throw new Error("Invalid database schema");
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  options: `-c search_path=${schema}`,
  max: 8,
});
export async function query<T extends QueryResultRow>(
  text: string,
  values: unknown[] = [],
) {
  assertDatabaseConfig();
  try {
    return await pool.query<T>(text, values);
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      ["ECONNREFUSED", "ENOTFOUND"].includes(String(error.code))
    )
      throw createError({
        statusCode: 503,
        statusMessage: "Database unavailable",
        data: { message: "База данных временно недоступна" },
      });
    throw error;
  }
}
export async function transaction<T>(
  action: (client: PoolClient) => Promise<T>,
): Promise<T> {
  assertDatabaseConfig();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const value = await action(client);
    await client.query("COMMIT");
    return value;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
