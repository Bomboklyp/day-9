import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";

try {
  await writeFile(
    ".env.compose",
    `POSTGRES_PASSWORD=${randomBytes(32).toString("hex")}\nWORKFLOW_DB_PASSWORD=${randomBytes(32).toString("hex")}\nNUXT_PUBLIC_SITE_URL=http://localhost:3008\nAPP_PORT=3008\n`,
    { flag: "wx", mode: 0o600 },
  );
  console.log("Created .env.compose with a random database password");
} catch (error: unknown) {
  if (error && typeof error === "object" && "code" in error && error.code === "EEXIST")
    console.log(".env.compose already exists; its password was preserved");
  else throw error;
}
