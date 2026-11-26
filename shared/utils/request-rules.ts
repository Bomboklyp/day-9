import type { Role } from "../types/auth";
import type { RequestStatus } from "../types/request";

export const transitions: Record<RequestStatus, RequestStatus[]> = {
  new: ["assigned", "closed"],
  assigned: ["in_progress", "escalated", "closed"],
  in_progress: ["waiting", "resolved", "escalated", "closed"],
  waiting: ["in_progress", "escalated", "closed"],
  resolved: ["in_progress", "closed"],
  escalated: ["in_progress", "resolved", "closed"],
  closed: [],
};
export function allowedStatuses(
  status: RequestStatus,
  role: Role,
): RequestStatus[] {
  if (role === "Client") return [];
  return transitions[status].filter((next) =>
    role === "Agent"
      ? next !== "closed" && next !== "assigned" && next !== "escalated"
      : true,
  );
}

export interface TransitionFields {
  assigneeId?: string | null;
  reason?: string;
  resolution?: string;
}
export interface RuleProblem {
  statusCode: 409 | 422;
  message: string;
}
export function requiredStatusFields(
  status: RequestStatus,
  fields: TransitionFields,
): string | null {
  if (status === "escalated" && !fields.reason?.trim())
    return "Укажите причину эскалации.";
  if (status === "waiting" && !fields.reason?.trim())
    return "Укажите причину ожидания.";
  if (status === "resolved" && !fields.resolution?.trim())
    return "Опишите результат решения.";
  if (status === "closed" && !fields.reason?.trim())
    return "Укажите причину ручного закрытия.";
  return null;
}
export function validateTransition(
  current: RequestStatus,
  next: RequestStatus,
  role: Role,
  fields: TransitionFields,
): RuleProblem | null {
  if (!allowedStatuses(current, role).includes(next))
    return { statusCode: 409, message: "Недопустимый переход статуса" };
  if (
    ["assigned", "in_progress", "waiting", "resolved"].includes(next) &&
    !fields.assigneeId
  )
    return { statusCode: 422, message: "Сначала назначьте исполнителя" };
  const message = requiredStatusFields(next, fields);
  return message ? { statusCode: 422, message } : null;
}
export function requestCapabilities(status: RequestStatus, role: Role) {
  const next = allowedStatuses(status, role);
  return {
    next,
    formStatuses: next.filter(
      (value) =>
        !["assigned", "resolved", "closed", "escalated"].includes(value),
    ),
    staff: role === "Admin" || role === "Operator",
    editable: status !== "closed",
  };
}

export function statusAfterAssignment(
  current: RequestStatus,
  assigned: boolean,
  desired: RequestStatus = current,
): RequestStatus | null {
  if (assigned) return current === "new" ? "assigned" : desired;
  return current === "new" || current === "assigned" ? "new" : null;
}
