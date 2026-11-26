import type { ApiCatalogs, ApiRequest, ApiUser } from "#shared/types/api";
import type { Person, WorkflowRequest } from "~/types/workflow";
import { initials } from "~/utils/format";

function person(
  user: ApiUser | undefined,
  fallback: string,
  name?: string | null,
): Person {
  const resolved = name?.trim() || user?.name || fallback;
  return {
    name: resolved,
    initials: resolved === "Не назначен" ? "" : initials(resolved),
    color: user?.color ?? "purple",
  };
}
export function mapApiRequest(
  request: ApiRequest,
  catalogs: ApiCatalogs,
): WorkflowRequest {
  return {
    escalationReason: request.escalation_reason,
    sla: request.sla,
    incomplete: !request.title?.trim() || !request.customer_id,
    resolution: request.resolution,
    waitingReason: request.waiting_reason,
    closingReason: request.closing_reason,
    id: request.id,
    title: request.title?.trim() || "Без названия",
    description: request.description?.trim() || "Описание не указано.",
    status: request.status,
    priority: request.priority,
    category:
      request.category_name ??
      catalogs.categories.find((item) => item.id === request.category_id)
        ?.name ??
      "Категория не указана",
    client:
      request.customer_name ??
      catalogs.customers.find((item) => item.id === request.customer_id)
        ?.name ??
      "Клиент не указан",
    author: person(
      catalogs.users.find((user) => user.id === request.author_id),
      "Автор не указан",
      request.author_name,
    ),
    assignee: person(
      catalogs.users.find((user) => user.id === request.assignee_id),
      "Не назначен",
      request.assignee_name,
    ),
    createdAt: request.created_at,
    dueAt: request.due_at ?? "",
    comments: (request.comments ?? []).map((comment) => ({
      id: comment.id,
      text: comment.text,
      createdAt: comment.created_at,
      author: person(
        catalogs.users.find((user) => user.id === comment.author_id),
        "Автор не указан",
        comment.author_name,
      ),
    })),
    timeline: (request.timeline ?? []).map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description ?? "",
      createdAt: event.created_at,
      kind: event.kind,
    })),
  };
}
