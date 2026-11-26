import { expect, test } from "vitest";
import { analyzeSources } from "../../tools/architecture";

test("shared rejects framework imports and app rejects server imports", () => {
  const result = analyzeSources({
    "shared/utils/rule.ts": 'import { ref } from "vue";',
    "app/features/requests/api.ts":
      'import { read } from "../../../server/services/requests";',
    "server/services/requests.ts": "export function read() {}",
  });
  expect(result.violations).toHaveLength(2);
});

test("cycle detection includes Nuxt auto-imported composables", () => {
  const result = analyzeSources({
    "app/composables/useAuth.ts":
      "export function useAuth() { return useApi(); }",
    "app/composables/useApi.ts":
      "export function useApi() { return useAuth(); }",
  });
  expect(result.cycles).toHaveLength(1);
  expect(result.edges.every((edge) => edge.implicit)).toBe(true);
});

test("HTTP handlers cannot bypass services and repositories cannot import them", () => {
  const result = analyzeSources({
    "server/api/requests/index.get.ts":
      'import { read } from "../../repositories/requests";',
    "server/repositories/requests.ts":
      'import { act } from "../services/requests"; export function read() {}',
    "server/services/requests.ts": "export function act() {}",
  });
  expect(result.violations).toHaveLength(2);
});

test("one-way feature, adapter and shared dependencies are allowed", () => {
  const result = analyzeSources({
    "app/features/requests/composables/useRequests.ts":
      'import { read } from "../api"; import { rule } from "#shared/utils/rule";',
    "app/features/requests/api.ts": "export function read() {}",
    "shared/utils/rule.ts": "export function rule() { return true; }",
  });
  expect(result.violations).toEqual([]);
  expect(result.cycles).toEqual([]);
});
