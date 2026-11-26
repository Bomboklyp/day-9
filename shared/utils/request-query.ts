import type { RequestsQuery } from "../types/api";
import { priorities, statuses } from "./request-options";

export type QuerySource = Record<string, unknown>;
const text = (value: unknown): string =>
  typeof value === "string" ? value : "";
function positiveInteger(
  value: unknown,
  fallback: number,
  maximum: number,
): number {
  const raw = text(value);
  if (!/^\d+$/.test(raw)) return fallback;
  const number = Number(raw);
  return Number.isSafeInteger(number) && number > 0
    ? Math.min(number, maximum)
    : fallback;
}
export function readRequestsQuery(query: QuerySource): RequestsQuery {
  return {
    q: text(query.q).trim().slice(0, 200),
    status: statuses.find((s) => s.value === text(query.status))?.value ?? "",
    priority:
      priorities.find((p) => p.value === text(query.priority))?.value ?? "",
    assignment:
      query.assignment === "mine" || query.assignment === "unassigned"
        ? query.assignment
        : "",
    sort:
      query.sort === "oldest" || query.sort === "priority"
        ? query.sort
        : "newest",
    page: positiveInteger(query.page, 1, 1000000),
    per_page: positiveInteger(query.per_page, 12, 100),
  };
}
export function requestsUrlQuery(query: RequestsQuery): Record<string, string> {
  return {
    ...(query.q ? { q: query.q } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.priority ? { priority: query.priority } : {}),
    ...(query.assignment ? { assignment: query.assignment } : {}),
    ...(query.sort !== "newest" ? { sort: query.sort } : {}),
    ...(query.page > 1 ? { page: String(query.page) } : {}),
    ...(query.per_page !== 12 ? { per_page: String(query.per_page) } : {}),
  };
}
