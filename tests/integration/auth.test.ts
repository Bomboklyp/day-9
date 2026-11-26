import { beforeEach, expect, test, vi } from "vitest";
import { mockNuxtImport, registerEndpoint } from "@nuxt/test-utils/runtime";
import { useAuth } from "../../app/composables/useAuth";
import { clearNuxtState, useNuxtApp } from "#app";
import type { AuthSession } from "../../shared/types/auth";

const { requestFetch, navigate } = vi.hoisted(() => ({
  requestFetch: vi.fn(),
  navigate: vi.fn(),
}));
mockNuxtImport("useRequestFetch", () => () => requestFetch);
mockNuxtImport("navigateTo", () => navigate);
const session: AuthSession = {
  user: {
    id: "user-1",
    name: "Оператор",
    email: "operator@workflow.local",
    role: "Operator",
    is_active: true,
    customer_id: null,
  },
};
registerEndpoint("/api/auth/logout", {
  method: "POST",
  handler: () => ({ ok: true }),
});
beforeEach(() => {
  useNuxtApp().runWithContext(() => clearNuxtState());
  vi.clearAllMocks();
  vi.stubGlobal("$fetch", vi.fn().mockResolvedValue({ ok: true }));
});

test("REG-03: ответ проверки сессии, пришедший после logout, не возвращает пользователя", async () => {
  let finish: (value: AuthSession) => void = () => {};
  requestFetch.mockReturnValue(
    new Promise<AuthSession>((resolve) => {
      finish = resolve;
    }),
  );
  const auth = await useNuxtApp().runWithContext(() => useAuth());
  auth.user.value = session.user;
  const refresh = auth.refreshSession();
  await auth.logout();
  finish(session);
  await refresh;
  expect(auth.user.value).toBeNull();
});
