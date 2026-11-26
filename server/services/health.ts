import { query } from "../utils/database";

export async function checkDatabaseHealth() {
  await query("SELECT 1 FROM schema_migrations LIMIT 1");
}
