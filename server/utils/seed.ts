import { createMockRequests, team } from "../data/requests";
import { categories } from "../../shared/utils/request-options";
import type { ApiCatalogs, ApiRequest } from "../../shared/types/api";

export function createApiCatalogs(): ApiCatalogs {
  return {
    users: [
      ...team.map((person, index) => ({ id: `user-${index + 1}`, ...person })),
      {
        id: "user-5",
        name: "Александра Константиновна Рождественская-Соколова",
        initials: "АР",
        color: "purple",
      },
    ],
    customers: ["АО «Вектор»", "ООО «Сфера»", "ООО «Пульс»"].map(
      (name, index) => ({ id: `customer-${index + 1}`, name }),
    ),
    categories: categories.map((name, index) => ({
      id: `category-${index + 1}`,
      name,
    })),
  };
}
export function createApiSeed(): ApiRequest[] {
  const catalogs = createApiCatalogs();
  const records = createMockRequests().map((request): ApiRequest => ({
    revision: 1,
    id: request.id,
    title: request.title,
    description: request.description,
    status: request.status,
    priority: request.priority,
    customer_id: catalogs.customers.find((item) => item.name === request.client)
      ?.id,
    category_id: catalogs.categories.find(
      (item) => item.name === request.category,
    )?.id,
    author_id: catalogs.users.find((user) => user.name === request.author.name)
      ?.id,
    assignee_id:
      catalogs.users.find((user) => user.name === request.assignee.name)?.id ??
      null,
    created_at: request.createdAt,
    ...(request.id !== 1032 ? { due_at: request.dueAt } : {}),
    comments: request.comments.map((comment) => ({
      id: comment.id,
      text: comment.text,
      author_id: catalogs.users.find(
        (user) => user.name === comment.author.name,
      )?.id,
      created_at: comment.createdAt,
    })),
    timeline: request.timeline.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      kind: event.kind,
      created_at: event.createdAt,
    })),
  }));
  const active = records.find((request) => request.id === 1042)!;
  active.status = "in_progress";
  active.assignee_id = "user-3";
  active.comments!.push(
    {
      id: "1042-comment-2",
      author_id: "user-3",
      text: "Заявку приняла. Проверяем права доступа.",
      created_at: "2026-10-05T06:25:00.000Z",
    },
    {
      id: "1042-comment-3",
      author_id: "user-3",
      text: "Нашла причину: после обновления сбросилась группа доступа.",
      created_at: "2026-10-05T07:05:00.000Z",
    },
  );
  active.timeline!.push(
    {
      id: "1042-assigned",
      title: "Оператор назначил Брунгильду Брунгильдовну",
      created_at: "2026-10-05T06:25:00.000Z",
      kind: "status",
    },
    {
      id: "1042-started",
      title: "Брунгильда начала работу",
      created_at: "2026-10-05T07:00:00.000Z",
      kind: "status",
    },
  );
  return records;
}
