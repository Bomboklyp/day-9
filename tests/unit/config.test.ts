import { describe, expect, it } from "vitest";
import { assertDatabaseConfig } from "../../server/utils/config";

describe("database configuration", () => {
  it("requires an explicit database instead of system defaults", () => {
    expect(() => assertDatabaseConfig({})).toThrow("Set DATABASE_URL");
    expect(() => assertDatabaseConfig({ DATABASE_URL: "not-a-url" })).toThrow("PostgreSQL");
    expect(() => assertDatabaseConfig({ DATABASE_URL: "https://example.test/db" })).toThrow("PostgreSQL");
    expect(() => assertDatabaseConfig({ DATABASE_URL: "postgres://localhost" })).toThrow("database");
  });
  it("accepts local URLs and Compose environment variables", () => {
    expect(() => assertDatabaseConfig({ DATABASE_URL: "postgres://demo:example@localhost/workflow" })).not.toThrow();
    expect(() => assertDatabaseConfig({ PGHOST: "db", PGDATABASE: "workflow", PGUSER: "workflow", PGPASSWORD: "example" })).not.toThrow();
  });
});
