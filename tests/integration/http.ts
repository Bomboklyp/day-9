import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import type { Pool } from "pg";
import { demoPassword } from "../../tools/init-db";
import { tokenHash } from "../../server/utils/password";
import type {
  ApiItem,
  ApiRequest,
  ApiRequestsResponse,
  ApiUser,
} from "../../shared/types/api";
import type { AuthSession } from "../../shared/types/auth";

export class ApiClient {
  cookie = "";
  constructor(readonly base: string) {}
  async call<T>(
    path: string,
    method = "GET",
    body?: unknown,
    expected = 200,
  ): Promise<T> {
    if (
      method === "POST" &&
      path === "/api/comments" &&
      body &&
      typeof body === "object"
    )
      body = { client_id: randomUUID(), ...body };
    const response = await fetch(this.base + path, {
      method,
      headers: {
        ...(this.cookie ? { cookie: this.cookie } : {}),
        ...(body ? { "content-type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      redirect: "manual",
    });
    assert.equal(
      response.status,
      expected,
      `${method} ${path}: ${response.status}`,
    );
    for (const cookie of response.headers.getSetCookie())
      if (cookie.startsWith("workflow_session="))
        this.cookie = cookie.split(";")[0]!;
    const result: unknown = await response.json();
    assert.ok(
      !JSON.stringify(result).includes("password_hash"),
      "password hash must stay private",
    );
    return result as T;
  }
  async login(account: string) {
    return this.call<AuthSession>("/api/auth/login", "POST", {
      email: `${account}@workflow.local`,
      password: demoPassword,
    });
  }
  async request(id: number) {
    return (await this.call<ApiItem<ApiRequest>>(`/api/requests/${id}`)).data;
  }
  async patch(id: number, body: unknown, expected = 200) {
    return this.call<ApiItem<ApiRequest>>(
      `/api/requests/${id}`,
      "PATCH",
      body,
      expected,
    );
  }
}

export async function verifyHttp(base: string, database: Pool) {
  const guest = new ApiClient(base),
    client = new ApiClient(base),
    agent = new ApiClient(base),
    operator = new ApiClient(base),
    admin = new ApiClient(base);
  for (const path of [
    "requests",
    "requests/1042",
    "users",
    "customers",
    "categories",
    "comments?request_id=1042",
  ])
    await guest.call(`/api/${path}`, "GET", undefined, 401);
  assert.equal((await guest.call<AuthSession>("/api/auth/session")).user, null);
  await guest.call(
    "/api/auth/login",
    "POST",
    { email: "operator@workflow.local", password: "wrong" },
    401,
  );
  await guest.call(
    "/api/auth/login",
    "POST",
    { email: "inactive@workflow.local", password: demoPassword },
    401,
  );
  assert.equal((await client.login("client")).user?.role, "Client");
  assert.equal((await agent.login("agent")).user?.role, "Agent");
  assert.equal((await operator.login("operator")).user?.role, "Operator");
  assert.equal((await admin.login("admin")).user?.role, "Admin");
  const all = await operator.call<ApiRequestsResponse>("/api/requests");
  assert.ok(all.meta.total >= 25);
  const own = await client.call<ApiRequestsResponse>(
    "/api/requests?per_page=100",
  );
  assert.ok(
    own.data.length > 0 &&
      own.data.every((item) => item.author_id === "user-2"),
  );
  const foreign = (
    await operator.call<ApiRequestsResponse>("/api/requests?per_page=100")
  ).data.find((item) => item.author_id !== "user-2")!;
  await client.call(`/api/requests/${foreign.id}`, "GET", undefined, 404);
  await client.call(
    "/api/comments",
    "POST",
    { request_id: foreign.id, text: "forbidden" },
    404,
  );
  await client.patch(1042, { priority: "low" }, 403);
  const assigned = await agent.call<ApiRequestsResponse>(
    "/api/requests?per_page=100",
  );
  assert.ok(
    assigned.data.length > 0 &&
      assigned.data.every((item) => item.assignee_id === "user-3"),
  );
  await agent.call("/api/requests/1042", "GET", undefined, 404);
  for (const method of ["POST", "PATCH"])
    await agent.call(
      `/api/users${method === "PATCH" ? "/user-1" : ""}`,
      method,
      { role: "Admin" },
      403,
    );
  await operator.call("/api/users", "POST", {}, 403);
  for (const catalog of ["customers", "categories"])
    await agent.call(`/api/${catalog}`, "POST", { name: "Forbidden" }, 403);
  const marker = await operator.request(1043);
  assert.equal(marker.title, "не работает перчик");
  assert.equal(marker.description, "Учебная проверка оборудования");
  assert.equal(
    (await operator.call<ApiRequestsResponse>("/api/requests?q=%231043"))
      .data[0]?.id,
    1043,
  );
  assert.equal(
    (await operator.call<ApiRequestsResponse>("/api/requests?q=no-results-qa"))
      .meta.total,
    0,
  );
  assert.equal(
    (await operator.call<ApiRequestsResponse>("/api/requests?page=2")).meta
      .page,
    2,
  );
  const body = {
    title: "Проверка PostgreSQL",
    description: "Заявка для проверки полного жизненного цикла",
    category_id: "category-1",
    priority: "high",
  };
  await client.call(
    "/api/requests",
    "POST",
    { ...body, customer_id: "customer-2" },
    403,
  );
  await client.call(
    "/api/requests",
    "POST",
    { ...body, author_id: "user-1" },
    400,
  );
  await agent.call("/api/requests", "POST", body, 403);
  const created = (
    await client.call<ApiItem<ApiRequest>>("/api/requests", "POST", body, 201)
  ).data;
  assert.equal(created.author_id, "user-2");
  assert.equal(created.customer_id, "customer-1");
  await operator.patch(
    created.id,
    { status: "resolved", resolution: "Invalid transition" },
    409,
  );
  await operator.patch(created.id, { assignee_id: "user-4" }, 422);
  assert.equal((await operator.request(created.id)).assignee_id, null);
  const appointed = (
    await operator.patch(created.id, {
      assignee_id: "user-3",
      expected_revision: created.revision,
    })
  ).data;
  assert.equal(appointed.status, "assigned");
  await operator.patch(
    created.id,
    { priority: "low", expected_revision: created.revision },
    409,
  );
  await agent.patch(created.id, { priority: "low" }, 403);
  await agent.patch(created.id, { assignee_id: "user-5" }, 403);
  await agent.patch(created.id, { status: "in_progress" });
  await agent.patch(created.id, { status: "waiting" }, 422);
  await agent.patch(created.id, {
    status: "waiting",
    reason: "Нужен ответ клиента",
  });
  await agent.patch(created.id, { status: "in_progress" });
  await agent.patch(created.id, { status: "resolved" }, 422);
  await agent.patch(created.id, {
    status: "resolved",
    resolution: "Доступ восстановлен",
  });
  await agent.patch(created.id, { status: "resolved", resolution: "" }, 422);
  await operator.patch(created.id, { priority: "urgent" });
  assert.equal(
    (await client.request(created.id)).resolution,
    "Доступ восстановлен",
  );
  await operator.call(
    "/api/comments",
    "POST",
    { request_id: created.id, text: "Проверено оператором" },
    201,
  );
  assert.ok(
    (await client.request(created.id)).comments?.some(
      (comment) => comment.author_id === "user-1",
    ),
  );
  await operator.patch(created.id, { status: "closed" }, 422);
  await operator.patch(created.id, {
    status: "closed",
    reason: "Клиент подтвердил решение",
  });
  await operator.patch(created.id, { status: "in_progress" }, 409);
  const customer = await admin.call<ApiItem<{ id: string }>>(
    "/api/customers",
    "POST",
    { name: "Тестовая компания" },
    201,
  );
  const category = await admin.call<ApiItem<{ id: string }>>(
    "/api/categories",
    "POST",
    { name: "Тестовая категория" },
    201,
  );
  await admin.call(`/api/categories/${category.data.id}`, "PATCH", {
    name: "Изменённая категория",
  });
  const newUser = await admin.call<ApiItem<ApiUser>>(
    "/api/users",
    "POST",
    {
      name: "Тестовый исполнитель",
      email: "qa-agent@workflow.local",
      password: demoPassword,
      role: "Agent",
    },
    201,
  );
  const temporary = new ApiClient(base);
  await temporary.login("qa-agent");
  await admin.call(`/api/users/${newUser.data.id}`, "PATCH", {
    is_active: false,
  });
  await temporary.call("/api/requests", "GET", undefined, 401);
  await admin.call(
    "/api/users",
    "POST",
    {
      name: "Клиент",
      email: "qa-client@workflow.local",
      password: demoPassword,
      role: "Client",
    },
    422,
  );
  const registerBody = {
    name: "Новый клиент",
    company: "Компания",
    email: "qa-client@workflow.local",
    password: demoPassword,
  };
  await guest.call(
    "/api/auth/register",
    "POST",
    { ...registerBody, role: "Admin" },
    400,
  );
  const registered = await guest.call<AuthSession>(
    "/api/auth/register",
    "POST",
    registerBody,
    201,
  );
  assert.equal(registered.user?.role, "Client");
  assert.notEqual(registered.user?.customer_id, customer.data.id);
  await guest.call("/api/auth/register", "POST", registerBody, 409);
  await guest.call(
    "/api/auth/profile",
    "PATCH",
    { name: "New", email: "qa-client@workflow.local", role: "Admin" },
    400,
  );
  await guest.call("/api/auth/profile", "PATCH", {
    name: "Обновлённый клиент",
    email: "qa-client@workflow.local",
  });
  const clientId = randomUUID(),
    duplicateText = "Concurrent delivery regression";
  const beforeComment = await operator.request(1042);
  await Promise.all(
    [1, 2].map(() =>
      operator.call(
        "/api/comments",
        "POST",
        { request_id: 1042, text: duplicateText, client_id: clientId },
        201,
      ),
    ),
  );
  const afterComment = await operator.request(1042);
  assert.equal(
    afterComment.comments?.filter((comment) => comment.text === duplicateText)
      .length,
    1,
  );
  assert.equal(afterComment.revision, (beforeComment.revision ?? 1) + 1);
  const conflict = await operator.call<{ data: { message: string } }>(
    "/api/comments",
    "POST",
    { request_id: 1042, text: "Different text", client_id: clientId },
    409,
  );
  assert.equal(
    conflict.data.message,
    "Этот ключ уже использован для другого комментария. Обновите форму и повторите отправку.",
  );
  console.log(
    "OK concurrent comment retry: one row, one revision, conflict for different payload",
  );
  const replay = new ApiClient(base);
  replay.cookie = client.cookie;
  await client.call("/api/auth/logout", "POST");
  await replay.call("/api/requests", "GET", undefined, 401);
  const token = agent.cookie.slice("workflow_session=".length);
  const stored = await database.query<{ token_hash: string }>(
    "SELECT token_hash FROM sessions WHERE token_hash=$1",
    [tokenHash(token)],
  );
  assert.equal(stored.rows.length, 1);
  assert.notEqual(stored.rows[0]!.token_hash, token);
  await database.query(
    "UPDATE sessions SET expires_at=now()-interval '1 second' WHERE token_hash=$1",
    [tokenHash(token)],
  );
  await agent.call("/api/requests", "GET", undefined, 401);
  const crossSite = await fetch(base + "/api/auth/login", {
    method: "POST",
    headers: {
      origin: "https://other.example",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email: "operator@workflow.local",
      password: demoPassword,
    }),
  });
  assert.equal(crossSite.status, 403);
  console.log(
    "OK HTTP: SQL persistence, 4 roles, isolated access, CRUD, transitions, inactive assignee, revision conflicts, sessions",
  );
  return {
    createdId: created.id,
    statuses: [200, 201, 400, 401, 403, 404, 409, 422],
    roles: 4,
  };
}
