import { existsSync, statSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, join, relative } from "node:path";
import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import { parseEnv } from "node:util";
import pg from "pg";

const project = process.cwd(),
  workspace = resolve(project, "..");
let storageRoot = workspace;
if (
  process.platform === "win32" &&
  Array.from(workspace).some((char) => char.charCodeAt(0) > 127)
) {
  for (const letter of ["W", "V", "U", "T", "S"]) {
    const drive = `${letter}:\\`;
    if (existsSync(drive)) {
      if (
        statSync(drive).dev === statSync(workspace).dev &&
        statSync(drive).ino === statSync(workspace).ino
      ) {
        storageRoot = drive;
        break;
      }
      continue;
    }
    execFileSync("subst.exe", [`${letter}:`, workspace], {
      windowsHide: true,
      stdio: "ignore",
    });
    storageRoot = drive;
    break;
  }
  if (storageRoot === workspace)
    throw new Error("No free drive letter for PostgreSQL path");
}
const envFile = resolve(project, ".env");
let databaseUrl =
  process.env.DATABASE_URL ??
  (existsSync(envFile)
    ? parseEnv(await readFile(envFile, "utf8")).DATABASE_URL
    : undefined);
let bin = [
  process.env.PG_BIN,
  join(workspace, ".tools/postgres-sdk/pgsql/bin"),
  "C:/Program Files/PostgreSQL/18/bin",
  "C:/Program Files/PostgreSQL/17/bin",
].find((folder) => folder && existsSync(join(folder, "pg_ctl.exe")));
if (bin && !relative(workspace, bin).startsWith(".."))
  bin = join(storageRoot, relative(workspace, bin));
const directory = join(storageRoot, ".tools/postgres-local"),
  data = join(directory, "data");
if (!databaseUrl) {
  if (!bin)
    throw new Error(
      "Install PostgreSQL and set DATABASE_URL in .env, then run npm run db:init",
    );
  await mkdir(directory, { recursive: true });
  const secretFile = join(directory, "access.json");
  const secrets: { bootstrap: string; app: string } = existsSync(secretFile)
    ? JSON.parse(await readFile(secretFile, "utf8"))
    : {
        bootstrap: randomBytes(24).toString("hex"),
        app: randomBytes(24).toString("hex"),
      };
  await writeFile(secretFile, JSON.stringify(secrets), { mode: 0o600 });
  const passwordFile = join(directory, "bootstrap-password.txt");
  await writeFile(passwordFile, secrets.bootstrap, { mode: 0o600 });
  if (!existsSync(join(data, "PG_VERSION")))
    execFileSync(
      join(bin, "initdb.exe"),
      [
        "-D",
        data,
        "-U",
        "workflow_bootstrap",
        "--encoding=UTF8",
        "--locale=C",
        "--auth-host=scram-sha-256",
        "--auth-local=scram-sha-256",
        `--pwfile=${passwordFile}`,
      ],
      { windowsHide: true, stdio: "ignore" },
    );
  let running = false;
  try {
    execFileSync(join(bin, "pg_ctl.exe"), ["-D", data, "status"], {
      windowsHide: true,
      stdio: "ignore",
    });
    running = true;
  } catch {}
  if (!running)
    execFileSync(
      join(bin, "pg_ctl.exe"),
      [
        "-D",
        data,
        "-l",
        join(directory, "postgres.log"),
        "-o",
        "-h 127.0.0.1 -p 5544",
        "-w",
        "start",
      ],
      { windowsHide: true, stdio: "ignore" },
    );
  const admin = new pg.Client({
    host: "127.0.0.1",
    port: 5544,
    user: "workflow_bootstrap",
    password: secrets.bootstrap,
    database: "postgres",
  });
  await admin.connect();
  try {
    if (
      !(
        await admin.query(
          "SELECT 1 FROM pg_roles WHERE rolname='workflow_local'",
        )
      ).rowCount
    )
      await admin.query(
        `CREATE ROLE workflow_local LOGIN PASSWORD '${secrets.app}'`,
      );
    if (
      !(
        await admin.query(
          "SELECT 1 FROM pg_database WHERE datname='workflow_day9'",
        )
      ).rowCount
    )
      await admin.query("CREATE DATABASE workflow_day9 OWNER workflow_local");
  } finally {
    await admin.end();
  }
  databaseUrl = `postgresql://workflow_local:${secrets.app}@127.0.0.1:5544/workflow_day9`;
  await writeFile(envFile, `DATABASE_URL=${databaseUrl}\n`, { mode: 0o600 });
} else if (
  bin &&
  databaseUrl.includes("127.0.0.1:5544") &&
  existsSync(join(data, "PG_VERSION"))
) {
  try {
    execFileSync(join(bin, "pg_ctl.exe"), ["-D", data, "status"], {
      windowsHide: true,
      stdio: "ignore",
    });
  } catch {
    execFileSync(
      join(bin, "pg_ctl.exe"),
      [
        "-D",
        data,
        "-l",
        join(directory, "postgres.log"),
        "-o",
        "-h 127.0.0.1 -p 5544",
        "-w",
        "start",
      ],
      { windowsHide: true, stdio: "ignore" },
    );
  }
}
execFileSync(process.execPath, ["--import", "tsx", "tools/init-db.ts"], {
  cwd: project,
  env: { ...process.env, DATABASE_URL: databaseUrl },
  windowsHide: true,
  stdio: "inherit",
});
console.log("PostgreSQL is ready");
