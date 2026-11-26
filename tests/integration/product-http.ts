import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import pg from "pg";
import { ApiClient } from "./http";
import { migrateDatabase } from "../../tools/migrate-db";
import { initializeDatabase } from "../../tools/init-db";
import type {
  ApiItem,
  ApiRequest,
  ApiCollection,
} from "../../shared/types/api";
import type {
  ApiAttachment,
  ApiNotification,
  Analytics,
  SlaPolicy,
} from "../../shared/types/product";

export async function verifyUpgrade(connectionString: string, schema: string) {
  const name = `${schema}_upgrade`;
  assert.match(name, /^workflow_test_day9_[0-9]+_upgrade$/);
  const admin = new pg.Pool({ connectionString });
  const database = new pg.Pool({
    connectionString,
    options: `-c search_path=${name}`,
  });
  try {
    await admin.query(`CREATE SCHEMA ${name}`);
    await database.query(await readFile("database/schema.sql", "utf8"));
    await database.query(
      "INSERT INTO customers VALUES('legacy-customer','Старый клиент'); INSERT INTO categories VALUES('legacy-category','Старая категория'); INSERT INTO users(id,name,email,password_hash,role) VALUES('legacy-user','Оператор','legacy@workflow.local','unused','Operator'); INSERT INTO requests(id,title,description,status,priority,customer_id,category_id,author_id) VALUES(100,'Старая заявка','Данные должны сохраниться','new','high','legacy-customer','legacy-category','legacy-user')",
    );
    await migrateDatabase(database);
    await migrateDatabase(database);
    await initializeDatabase(database);
    assert.equal(
      (
        await database.query(
          "SELECT count(*)::int AS count FROM schema_migrations",
        )
      ).rows[0].count,
      2,
    );
    const row = (
      await database.query(
        "SELECT title,response_due_at FROM requests WHERE id=100",
      )
    ).rows[0];
    assert.equal(row.title, "Старая заявка");
    assert.ok(row.response_due_at);
    await assert.rejects(
      database.query(
        "UPDATE requests SET status='escalated',escalation_reason=NULL WHERE id=100",
      ),
      { code: "23514" },
    );
    console.log(
      "OK migration: clean schema, Day 7 upgrade, repeat application, preserved data and database constraint",
    );
  } finally {
    await database.end();
    await admin.query(`DROP SCHEMA IF EXISTS ${name} CASCADE`);
    await admin.end();
  }
}

export async function verifyProduct(base: string, database: pg.Pool) {
  const operator = new ApiClient(base),
    admin = new ApiClient(base),
    agent = new ApiClient(base),
    client = new ApiClient(base),
    other = new ApiClient(base),
    guest = new ApiClient(base);
  for (const [api, account] of [
    [operator, "operator"],
    [admin, "admin"],
    [agent, "agent"],
    [client, "client"],
    [other, "client2"],
  ] as const)
    await api.login(account);
  await guest.call("/api/notifications", "GET", undefined, 401);
  for (const api of [operator, agent, client]) {
    await api.call("/api/admin/sla", "GET", undefined, 403);
    await api.call("/api/admin/analytics", "GET", undefined, 403);
    await api.call(
      "/api/admin/sla/high",
      "PATCH",
      { response_minutes: 1, resolution_minutes: 2 },
      403,
    );
  }
  const policies = await admin.call<ApiCollection<SlaPolicy>>("/api/admin/sla");
  assert.equal(policies.data.length, 4);
  assert.equal(policies.data[0]!.response_minutes, 15);
  await admin.call(
    "/api/admin/sla/high",
    "PATCH",
    { response_minutes: 0, resolution_minutes: 1 },
    400,
  );
  await admin.call(
    "/api/admin/sla/high",
    "PATCH",
    { response_minutes: 30, resolution_minutes: 10 },
    400,
  );
  await admin.call("/api/admin/sla/high", "PATCH", {
    response_minutes: 30,
    resolution_minutes: 180,
  });
  const before = (await admin.call<ApiItem<Analytics>>("/api/admin/analytics"))
    .data;
  const created = (
    await operator.call<ApiItem<ApiRequest>>(
      "/api/requests",
      "POST",
      {
        title: "Проверка новых требований",
        description: "Нужно проверить SLA, эскалацию и вложения.",
        priority: "high",
        category_id: "category-1",
        customer_id: "customer-1",
      },
      201,
    )
  ).data;
  const id = created.id;
  assert.equal(
    (Date.parse(created.response_due_at!) - Date.parse(created.created_at)) /
      60000,
    30,
  );
  assert.equal(
    (Date.parse(created.due_at!) - Date.parse(created.created_at)) / 60000,
    180,
  );
  await operator.patch(id, { priority: "urgent" });
  const urgent = await operator.request(id);
  assert.equal(
    (Date.parse(urgent.due_at!) - Date.parse(urgent.created_at)) / 60000,
    60,
  );
  await operator.patch(id, { assignee_id: "user-3" });
  const notifications = (
    await agent.call<ApiCollection<ApiNotification>>("/api/notifications")
  ).data;
  assert.ok(
    notifications.some(
      (item) => item.request_id === id && item.kind === "assignment",
    ),
  );
  const assigned = await operator.request(id);
  await operator.call(
    `/api/requests/${id}`,
    "PATCH",
    { status: "escalated", reason: " ", expected_revision: assigned.revision },
    422,
  );
  await agent.call(
    `/api/requests/${id}`,
    "PATCH",
    {
      status: "escalated",
      reason: "Нужна помощь",
      expected_revision: assigned.revision,
    },
    409,
  );
  await operator.patch(id, {
    status: "escalated",
    reason: "Требуется помощь старшего специалиста",
  });
  const escalated = await operator.request(id);
  assert.equal(escalated.status, "escalated");
  assert.equal(
    escalated.escalation_reason,
    "Требуется помощь старшего специалиста",
  );
  await operator.call(
    `/api/requests/${id}`,
    "PATCH",
    { status: "escalated", reason: "", expected_revision: escalated.revision },
    422,
  );
  const mine = (
    await operator.call<ApiCollection<ApiNotification>>("/api/notifications")
  ).data;
  const notification = mine.find(
    (item) => item.request_id === id && item.kind === "escalation",
  )!;
  assert.ok(notification);
  assert.ok(
    !(
      await other.call<ApiCollection<ApiNotification>>("/api/notifications")
    ).data.some((item) => item.request_id === id),
  );
  await other.call("/api/notifications/read", "PATCH", { id: notification.id });
  assert.equal(
    (
      await operator.call<ApiCollection<ApiNotification>>("/api/notifications")
    ).data.find((item) => item.id === notification.id)!.read_at,
    null,
  );
  await operator.call("/api/notifications/read", "PATCH", {
    id: notification.id,
  });
  assert.ok(
    (
      await operator.call<ApiCollection<ApiNotification>>("/api/notifications")
    ).data.find((item) => item.id === notification.id)!.read_at,
  );
  const after = (await admin.call<ApiItem<Analytics>>("/api/admin/analytics"))
    .data;
  assert.equal(after.total, before.total + 1);
  assert.equal(after.by_status.escalated, before.by_status.escalated + 1);
  assert.equal(
    after.workload.find((item) => item.id === "user-3")!.active,
    before.workload.find((item) => item.id === "user-3")!.active + 1,
  );
  await database.query(
    "UPDATE requests SET created_at=now()-interval '50 minutes',due_at=now()+interval '10 minutes',response_due_at=now()-interval '35 minutes',responded_at=now()-interval '45 minutes' WHERE id=$1",
    [id],
  );
  await operator.call("/api/notifications");
  await operator.call("/api/notifications");
  assert.equal(
    (
      await database.query<{ count: number }>(
        "SELECT count(*)::int AS count FROM notifications WHERE user_id='user-1' AND request_id=$1 AND kind='sla'",
        [id],
      )
    ).rows[0]!.count,
    1,
  );
  const png = await readFile("public/images/octagon.png");
  async function upload(
    api: ApiClient,
    files: { name: string; bytes: Uint8Array; type: string }[],
    expected: number,
  ) {
    const form = new FormData();
    for (const file of files)
      form.append(
        "files",
        new Blob([new Uint8Array(file.bytes)], { type: file.type }),
        file.name,
      );
    const response = await fetch(`${base}/api/requests/${id}/attachments`, {
      method: "POST",
      headers: { cookie: api.cookie },
      body: form,
    });
    assert.equal(response.status, expected);
    return (await response.json()) as ApiCollection<ApiAttachment>;
  }
  const valid = { name: "error-login.png", bytes: png, type: "image/png" };
  await upload(other, [valid], 404);
  await upload(
    operator,
    [
      {
        name: "fake.png",
        bytes: new TextEncoder().encode("<html>fake</html>"),
        type: "image/png",
      },
    ],
    415,
  );
  await upload(
    operator,
    [
      {
        name: "too-large.pdf",
        bytes: new Uint8Array(10 * 1024 * 1024 + 1),
        type: "application/pdf",
      },
    ],
    413,
  );
  await upload(
    operator,
    Array.from({ length: 6 }, (_, i) => ({ ...valid, name: `file-${i}.png` })),
    422,
  );
  const batch = () =>
    Array.from({ length: 3 }, (_, i) => ({ ...valid, name: `part-${i}.png` }));
  const statuses = await Promise.all(
    [0, 1].map(async () => {
      const form = new FormData();
      for (const file of batch())
        form.append("files", new Blob([png], { type: "image/png" }), file.name);
      return (
        await fetch(`${base}/api/requests/${id}/attachments`, {
          method: "POST",
          headers: { cookie: operator.cookie },
          body: form,
        })
      ).status;
    }),
  );
  assert.deepEqual(statuses.sort(), [201, 422]);
  const attachments = (
    await operator.call<ApiCollection<ApiAttachment>>(
      `/api/requests/${id}/attachments`,
    )
  ).data;
  assert.equal(attachments.length, 3);
  const download = await fetch(
    `${base}/api/attachments/${attachments[0]!.id}`,
    { headers: { cookie: operator.cookie } },
  );
  assert.equal(download.status, 200);
  assert.equal(download.headers.get("x-content-type-options"), "nosniff");
  assert.deepEqual(Buffer.from(await download.arrayBuffer()), png);
  await other.call(
    `/api/attachments/${attachments[0]!.id}`,
    "GET",
    undefined,
    404,
  );
  await guest.call(
    `/api/attachments/${attachments[0]!.id}`,
    "GET",
    undefined,
    401,
  );
  await operator.patch(id, {
    status: "resolved",
    resolution: "Проверки завершены",
  });
  await operator.patch(id, { status: "closed", reason: "Завершено" });
  await upload(operator, [valid], 409);
  await admin.call("/api/admin/sla/high", "PATCH", {
    response_minutes: 60,
    resolution_minutes: 240,
  });
  console.log(
    "OK product HTTP: SLA, role checks, escalation, atomic attachments, downloads, private notifications, deduplication and analytics",
  );
  return {
    migrationUpgrade: true,
    sla: true,
    escalation: true,
    attachments: true,
    concurrentFileLimit: true,
    notifications: true,
    analytics: true,
  };
}
