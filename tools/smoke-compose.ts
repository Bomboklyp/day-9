import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";

const base = "http://localhost:3008";
let ready = false;
for (let i = 0; i < 100; i++) {
  try {
    if ((await fetch(base + "/api/health")).ok) { ready = true; break; }
  } catch {}
  await new Promise((resolve) => setTimeout(resolve, 300));
}
assert.ok(ready, "Compose application must become healthy");
assert.equal((await fetch(base + "/api/requests")).status, 401);
const login = await fetch(base + "/api/auth/login", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: "client@workflow.local", password: "Practice123!" }),
});
assert.equal(login.status, 200);
const cookie = login.headers.getSetCookie().find((value) => value.startsWith("workflow_session=") && value.includes("HttpOnly"))!.split(";")[0]!;
if (process.argv.includes("--persisted")) {
  const id = Number(await readFile(".verification/compose-request.txt", "utf8"));
  const response = await fetch(`${base}/api/requests/${id}`, { headers: { cookie } });
  assert.equal(response.status, 200);
  const result = await response.json() as { data: { title: string } };
  assert.equal(result.data.title, "Compose persistence check");
  console.log("Compose restart preserved the created request");
} else {
  const response = await fetch(base + "/api/requests", {
    method: "POST",
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify({ title: "Compose persistence check", description: "Created in a clean Docker Compose environment", category_id: "category-1", priority: "high" }),
  });
  assert.equal(response.status, 201);
  const result = await response.json() as { data: { id: number } };
  assert.ok(Number.isInteger(result.data.id));
  await mkdir(".verification", { recursive: true });
  await writeFile(".verification/compose-request.txt", String(result.data.id));
  console.log("Compose health, access control, demo login and request creation passed");
}
