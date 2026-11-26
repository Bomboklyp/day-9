import type { WorkflowRequest } from "../../shared/types/workflow";

export const projectRequestTitle = "не работает перчик";

function createProjectRequest(id: number): WorkflowRequest {
  const createdAt = "2026-11-21T15:03:54.000Z";
  return {
    id,
    title: projectRequestTitle,
    description: "Учебная проверка оборудования",
    client: "АО «Вектор»",
    status: "new",
    priority: "urgent",
    category: "Доступ и учётные записи",
    author: { name: "Анна Кузнецова", initials: "АК", color: "purple" },
    assignee: { name: "Не назначен", initials: "", color: "purple" },
    createdAt,
    dueAt: "2026-11-22T15:03:54.000Z",
    comments: [],
    timeline: [
      {
        id: `${id}-created`,
        title: "Анна Кузнецова создала заявку",
        description: "",
        createdAt,
        kind: "created",
      },
    ],
  };
}

export function ensureProjectRequest(
  requests: WorkflowRequest[],
): WorkflowRequest[] {
  if (
    requests.some(
      (request) => request.title.trim().toLowerCase() === projectRequestTitle,
    )
  )
    return requests;

  const id = requests.some((request) => request.id === 1043)
    ? Math.max(1043, ...requests.map((request) => request.id)) + 1
    : 1043;
  return [createProjectRequest(id), ...requests];
}
