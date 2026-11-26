import { allowedStatuses } from "../../shared/utils/request-rules";
import assert from "node:assert/strict";
import { test } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { canReadRequest } from "../../shared/utils/permissions";
import {
  hashPassword,
  verifyPassword,
  tokenHash,
} from "../../server/utils/password";
import {
  registerSchema,
  updateRequestSchema,
  profileSchema,
  parseInput,
} from "../../server/utils/schemas";
import {
  readRequestsQuery,
  requestsUrlQuery,
} from "../../shared/utils/request-query";
import { mapApiRequest } from "../../app/utils/api";
import { usePreferencesStore } from "../../app/stores/preferences";
import type { SessionUser } from "../../shared/types/auth";

const user: SessionUser = {
  id: "a",
  role: "Client",
  name: "Client",
  email: "a@example.com",
  is_active: true,
  customer_id: "c",
};
test("клиент видит свои заявки, исполнитель — назначенные", () => {
  assert.ok(canReadRequest(user, { author_id: "a" }));
  assert.ok(!canReadRequest(user, { author_id: "b" }));
  assert.ok(canReadRequest({ ...user, role: "Agent" }, { assignee_id: "a" }));
  assert.ok(!canReadRequest({ ...user, role: "Agent" }, { assignee_id: "b" }));
});
test("серверный граф переходов учитывает роль и конечный статус", () => {
  assert.deepEqual(allowedStatuses("new", "Client"), []);
  assert.deepEqual(allowedStatuses("assigned", "Agent"), ["in_progress"]);
  assert.ok(!allowedStatuses("in_progress", "Agent").includes("closed"));
  assert.ok(allowedStatuses("resolved", "Operator").includes("closed"));
  assert.deepEqual(allowedStatuses("closed", "Admin"), []);
});
test("пароль хранится с солью и проверяется по хешу", async () => {
  const first = await hashPassword("test-password");
  assert.notEqual(first, await hashPassword("test-password"));
  assert.ok(await verifyPassword("test-password", first));
  assert.ok(!(await verifyPassword("wrong", first)));
  assert.equal(tokenHash("token").length, 64);
});
test("регистрация не принимает подмену роли", () => {
  assert.throws(() =>
    parseInput(registerSchema, {
      name: "Test",
      company: "Test",
      email: "test@example.com",
      password: "12345678",
      role: "Admin",
    }),
  );
});
test("изменение заявки не принимает автора и неизвестные поля", () => {
  assert.throws(() =>
    parseInput(updateRequestSchema, { author_id: "a", status: "resolved" }),
  );
  assert.throws(() =>
    parseInput(updateRequestSchema, { expected_revision: 1 }),
  );
  assert.throws(() => parseInput(updateRequestSchema, { priority: "invalid" }));
});
test("профиль не позволяет менять роль и активность", () => {
  assert.throws(() =>
    parseInput(profileSchema, {
      name: "Test",
      email: "test@example.com",
      role: "Admin",
    }),
  );
  assert.equal(
    parseInput(profileSchema, { name: "Test", email: "TEST@example.com" })
      .email,
    "test@example.com",
  );
});
test("URL восстанавливает фильтры и безопасно нормализует ошибки", () => {
  const value = readRequestsQuery({
    q: " CRM ",
    status: "new",
    priority: "high",
    sort: "oldest",
    page: "2",
  });
  assert.deepEqual(readRequestsQuery(requestsUrlQuery(value)), value);
  assert.equal(readRequestsQuery({ page: "-1", status: "oops" }).page, 1);
  assert.equal(readRequestsQuery({ page: "-1", status: "oops" }).status, "");
});
test("необязательные поля API имеют безопасные подписи", () => {
  const request = mapApiRequest(
    { id: 1, status: "new", priority: "high", created_at: "2026-01-01" },
    { users: [], customers: [], categories: [] },
  );
  assert.equal(request.title, "Без названия");
  assert.equal(request.assignee.name, "Не назначен");
  assert.deepEqual(request.comments, []);
});
test("Pinia хранит только UI-настройки, без авторизации и паролей", () => {
  setActivePinia(createPinia());
  const store = usePreferencesStore();
  store.save("compact", false);
  assert.equal(store.density, "compact");
  assert.equal(store.notifications, false);
  assert.ok(!("role" in store.$state));
  assert.ok(!("password" in store.$state));
});
