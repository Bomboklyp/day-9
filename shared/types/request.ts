export type RequestStatus =
  | "new"
  | "assigned"
  | "in_progress"
  | "waiting"
  | "resolved"
  | "closed"
  | "escalated";
export type RequestPriority = "low" | "medium" | "high" | "urgent";
