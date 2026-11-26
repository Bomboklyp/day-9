import {
  verifyProduct,
  verifyUpgrade,
} from "../tests/integration/product-http";
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import pg from "pg";
import { initializeDatabase } from "./init-db";
import { ApiClient, verifyHttp } from "../tests/integration/http";
import { verifyRelease } from "../tests/integration/release-http";

const configuration = await readFile(".env", "utf8").then(parseEnv).catch(() => ({} as Record<string, string>));
const connectionString = process.env.DATABASE_URL ?? configuration.DATABASE_URL;
if (!connectionString)
  throw new Error("DATABASE_URL is required; run npm run db:local");
const schema = `workflow_test_day9_${Date.now()}`;
assert.match(schema, /^workflow_test_day9_[0-9]+$/);
const root = new pg.Pool({ connectionString });
const database = new pg.Pool({
  connectionString,
  options: `-c search_path=${schema}`,
});
const base = "http://127.0.0.1:3109";
let server: ChildProcess | undefined,
  logs = "";
async function start() {
  server = spawn(process.execPath, [".output/server/index.mjs"], {
    windowsHide: true,
    env: {
      ...process.env,
      NODE_ENV: "production",
      DEBUG: "",
      DATABASE_URL: connectionString,
      WORKFLOW_DB_SCHEMA: schema,
      PORT: "3109",
      WORKFLOW_DISABLE_SLA_TIMER: "1",
      HOST: "127.0.0.1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout?.on("data", (chunk: Buffer) => {
    logs += chunk.toString();
  });
  server.stderr?.on("data", (chunk: Buffer) => {
    logs += chunk.toString();
  });
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null)
      throw new Error(`Test server stopped: ${logs}`);
    try {
      if ((await fetch(base + "/api/auth/session")).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error("Test server did not start");
}
async function stop() {
  if (server && server.exitCode === null) {
    const closed = once(server, "exit");
    server.kill();
    await closed;
  }
}
await mkdir(".verification/day9", { recursive: true });
await writeFile(
  ".verification/day9/report.json",
  JSON.stringify({ day: 9, status: "running" }),
);
try {
  await root.query(`CREATE SCHEMA ${schema}`);
  await verifyUpgrade(connectionString, schema);
  await initializeDatabase(database);
  await start();
  const http = await verifyHttp(base, database);
  await stop();
  await start();
  const operator = new ApiClient(base);
  await operator.login("operator");
  assert.equal((await operator.request(http.createdId)).status, "closed");
  console.log("OK PostgreSQL data survived server restart");
  const product = await verifyProduct(base, database);
  const release = await verifyRelease(base, database);
  let browser: unknown;
  if (!process.argv.includes("--http-only")) {
    const runner = spawn(
      process.execPath,
      ["node_modules/@playwright/test/cli.js", "test"],
      {
        windowsHide: true,
        env: {
          ...process.env,
      NODE_ENV: "production",
      DEBUG: "",
          DATABASE_URL: connectionString,
          WORKFLOW_DB_SCHEMA: schema,
          WORKFLOW_BASE_URL: base,
        },
        stdio: "inherit",
      },
    );
    const [code] = await once(runner, "exit");
    if (code !== 0) throw new Error("Playwright regression tests failed");
    browser = JSON.parse(
      await readFile(".verification/day9/e2e-result.json", "utf8"),
    ).stats;
  }
  await mkdir(".verification/day9", { recursive: true });
  await writeFile(
    ".verification/day9/report.json",
    JSON.stringify(
      {
        day: 9,
        status: "passed",
        testedAt: new Date().toISOString(),
        http,
        product,
        release,
        browser,
        persistedAfterRestart: true,
      },
      null,
      2,
    ),
  );
} finally {
  await writeFile(".verification/day9/server.log", logs);
  await stop();
  await database.end();
  await root.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  await root.end();
}
