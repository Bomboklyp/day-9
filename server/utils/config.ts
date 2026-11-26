export function assertDatabaseConfig(env: NodeJS.ProcessEnv = process.env) {
  if (env.DATABASE_URL) {
    let url: URL;
    try {
      url = new URL(env.DATABASE_URL);
    } catch {
      throw new Error("DATABASE_URL must be a PostgreSQL connection URL");
    }
    if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname || url.pathname.length < 2)
      throw new Error("DATABASE_URL must include a PostgreSQL host and database");
    return;
  }
  if (!env.PGHOST || !env.PGDATABASE || !env.PGUSER || !env.PGPASSWORD)
    throw new Error("Set DATABASE_URL or PGHOST, PGDATABASE, PGUSER and PGPASSWORD");
}
