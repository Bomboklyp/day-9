import type { RequestPriority, RequestStatus } from "./request";
export interface SlaPolicy {
  priority: RequestPriority;
  response_minutes: number;
  resolution_minutes: number;
}
export interface SlaPhase {
  state: "ok" | "warning" | "overdue" | "met";
  due_at: string | null;
  finished_at: string | null;
}
export interface RequestSla {
  response: SlaPhase;
  resolution: SlaPhase;
  calculated_at: string;
}
export interface ApiAttachment {
  id: string;
  request_id: number;
  filename: string;
  mime_type: string;
  size: number;
  created_at: string;
}
export interface ApiNotification {
  id: string;
  request_id: number;
  kind: "assignment" | "escalation" | "sla" | "status";
  title: string;
  message: string;
  created_at: string;
  read_at: string | null;
}
export interface Analytics {
  total: number;
  closed: number;
  sla_percent: number | null;
  average_resolution_minutes: number | null;
  by_status: Record<RequestStatus, number>;
  workload: { id: string; name: string; active: number }[];
}
