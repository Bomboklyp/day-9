import type { Role, SessionUser } from "../types/auth";
export function isStaff(role: Role) {
  return role === "Operator" || role === "Admin";
}
export function canReadRequest(
  user: SessionUser,
  request: { author_id?: string | null; assignee_id?: string | null },
) {
  return (
    isStaff(user.role) ||
    (user.role === "Client"
      ? request.author_id === user.id
      : request.assignee_id === user.id)
  );
}
