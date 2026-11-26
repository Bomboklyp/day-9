import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { parseEnv } from "node:util";

async function walk(directory = "."): Promise<string[]> {
  const result: string[] = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    if (item.name.startsWith(".") || ["node_modules", "WorkFlow-source.zip"].includes(item.name)) continue;
    const name = `${directory}/${item.name}`.replace(/^\.\//, "");
    if (item.isDirectory()) result.push(...await walk(name));
    else result.push(name);
  }
  return result;
}
let files: string[];
try {
  files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "ignore"] }).split("\0").filter(Boolean);
} catch {
  files = await walk();
}
const privateValues: string[] = [];
for (const filename of [".env", ".env.compose"]) {
  const env = await readFile(filename, "utf8").then(parseEnv).catch(() => ({} as Record<string, string>));
  if (env.DATABASE_URL) {
    const password = decodeURIComponent(new URL(env.DATABASE_URL).password);
    if (password.length >= 12) privateValues.push(password);
  }
  for (const [key, value] of Object.entries(env))
    if (/PASSWORD|SECRET|TOKEN/.test(key) && value.length >= 12) privateValues.push(value);
}
const rules: [string, RegExp][] = [
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["GitHub token", /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/],
  ["AWS access key", /\bAKIA[A-Z0-9]{16}\b/],
  ["Stripe live key", /\bsk_live_[A-Za-z0-9]{20,}\b/],
  ["private local path", /C:[\\/]Users[\\/](?!Public[\\/])[^\s"'<>\\/]+[\\/]/i],
];
const problems: string[] = [];
for (const file of files) {
  if (/^\.env(?:\.|$)/.test(file) && ![".env.example", ".env.compose.example"].includes(file)) problems.push(`${file}: private environment file`);
  if (!/\.(?:ts|vue|js|mjs|json|md|txt|sql|yml|yaml|xml|cmd|example)$/.test(file) && !["Dockerfile", ".gitignore", ".dockerignore"].includes(file)) continue;
  const text = await readFile(file, "utf8");
  for (const [name, pattern] of rules) if (pattern.test(text)) problems.push(`${file}: ${name}`);
  if (privateValues.some((value) => text.includes(value))) problems.push(`${file}: local database credential`);
}
if (problems.length) {
  console.error(problems.join("\n"));
  process.exitCode = 1;
} else console.log(`Release scan passed: ${files.length} files, no known credentials or private paths`);
