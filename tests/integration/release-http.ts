import assert from "node:assert/strict";
import type { Pool } from "pg";
import { ApiClient } from "./http";

export async function verifyRelease(base: string, database: Pool) {
  await database.query("DELETE FROM login_attempts");
  const health = await fetch(base + "/api/health");
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: "ok" });
  const publicPage = await fetch(base + "/help");
  assert.equal(publicPage.headers.get("x-content-type-options"), "nosniff");
  assert.equal(publicPage.headers.get("x-frame-options"), "DENY");
  assert.ok(publicPage.headers.get("content-security-policy")?.includes("frame-ancestors 'none'"));
  const guestPage = await fetch(base + "/requests", { redirect: "manual" });
  assert.ok([302, 307].includes(guestPage.status));
  assert.ok(!(await guestPage.text()).includes("Не работает доступ к CRM"));
  const blockedOrigin = await fetch(base + "/api/auth/login", {
    method: "POST",
    headers: { origin: "https://foreign.example", "content-type": "application/json" },
    body: JSON.stringify({ email: "operator@workflow.local", password: "wrong" }),
  });
  assert.equal(blockedOrigin.status, 403);
  const account = "release-limit@workflow.local";
  for (let i = 0; i < 10; i++) {
    const response = await fetch(base + "/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: account, password: "wrong" }),
    });
    assert.equal(response.status, 401);
  }
  const limited = await fetch(base + "/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: account, password: "wrong" }),
  });
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.get("retry-after")) > 0);
  assert.ok((await limited.text()).includes("Слишком много попыток"));
  await database.query("UPDATE login_attempts SET reset_at=now()-interval '1 second'");
  const retry = await fetch(base + "/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: account, password: "wrong" }),
  });
  assert.equal(retry.status, 401);
  assert.equal((await database.query<{ attempts: number }>("SELECT attempts FROM login_attempts WHERE attempts=1")).rowCount, 1);
  const client = new ApiClient(base);
  await client.login("operator");
  const session = await fetch(base + "/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "client@workflow.local", password: "Practice123!" }),
  });
  const cookie = session.headers.getSetCookie().find((value) => value.startsWith("workflow_session=") && value.includes("HttpOnly"));
  assert.ok(cookie?.includes("SameSite=Lax"));
  const stored = await database.query<{ token_hash: string }>("SELECT token_hash FROM sessions LIMIT 1");
  assert.match(stored.rows[0]!.token_hash, /^[a-f0-9]{64}$/);
  await database.query("DELETE FROM login_attempts");
  console.log("OK release: health, headers, private HTML, origin, login limit and cookie");
  return { health: true, headers: true, privateHtml: true, origin: true, loginRateLimit: true, cookie: true };
}
