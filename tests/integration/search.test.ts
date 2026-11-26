import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { effectScope, ref } from "vue";
import { clearNuxtData, clearNuxtState, useNuxtApp } from "#app";
import { useRequests } from "../../app/composables/useRequests";
import { useDebounce } from "../../app/composables/useDebounce";
import { readRequestsQuery } from "../../shared/utils/request-query";
import type { ApiRequestsResponse } from "../../shared/types/api";

const { api } = vi.hoisted(() => ({ api: vi.fn() }));
vi.mock("../../app/composables/useApi", () => ({ useApi: () => api }));
vi.mock("../../app/features/requests/composables/useCatalogs", () => ({
  useCatalogs: () => ({
    data: ref({ users: [], customers: [], categories: [] }),
    error: ref(null),
    status: ref("success"),
    refresh: vi.fn(),
  }),
}));
beforeEach(() => {
  clearNuxtData();
  clearNuxtState();
  api.mockReset();
});
afterEach(() => vi.useRealTimers());

function result(title: string): ApiRequestsResponse {
  return {
    data: [
      {
        id: 1042,
        title,
        status: "new",
        priority: "high",
        created_at: "2026-10-05T09:00:00Z",
      },
    ],
    meta: { page: 1, per_page: 12, total: 1, total_pages: 1 },
    stats: { new: 1, in_progress: 0, waiting: 0, resolved: 0 },
  };
}
test("REG-02: поздний ответ старого поиска не заменяет новый результат", async () => {
  const jobs = new Map<
    string,
    { finish: (value: ApiRequestsResponse) => void; signal: AbortSignal }
  >();
  api.mockImplementation(
    (_path, options: { query: { q: string }; signal: AbortSignal }) =>
      new Promise<ApiRequestsResponse>((resolve) => {
        jobs.set(options.query.q, { finish: resolve, signal: options.signal });
      }),
  );
  const query = ref(readRequestsQuery({ q: "" }));
  const scope = effectScope();
  const list = await scope.run(() =>
    useNuxtApp().runWithContext(() => useRequests(query, "race-test")),
  )!;
  await flushPromises();
  jobs.get("")!.finish(result("Initial"));
  await flushPromises();
  query.value = readRequestsQuery({ q: "old" });
  await flushPromises();
  expect(jobs.has("old")).toBe(true);
  query.value = readRequestsQuery({ q: "new" });
  await flushPromises();
  expect(jobs.has("new")).toBe(true);
  jobs.get("new")!.finish(result("Новый результат"));
  await flushPromises();
  expect(list.requests.value[0]?.title).toBe("Новый результат");
  jobs.get("old")!.finish(result("Устаревший результат"));
  await flushPromises();
  expect(list.requests.value[0]?.title).toBe("Новый результат");
  expect(jobs.get("old")!.signal.aborted).toBe(true);
  scope.stop();
});
test("debounce публикует только последний ввод и останавливается вместе с composable", async () => {
  vi.useFakeTimers();
  const input = ref(""),
    scope = effectScope();
  const value = scope.run(() => useDebounce(input, 350))!;
  input.value = "C";
  await flushPromises();
  input.value = "CRM";
  await flushPromises();
  await vi.advanceTimersByTimeAsync(349);
  expect(value.value).toBe("");
  await vi.advanceTimersByTimeAsync(1);
  expect(value.value).toBe("CRM");
  input.value = "late";
  await flushPromises();
  scope.stop();
  await vi.advanceTimersByTimeAsync(1000);
  expect(value.value).toBe("CRM");
});
