import type { RequestSla } from "./product";
import type { RequestPriority, RequestStatus } from "./request";

export interface Person {
  name: string;
  initials: string;
  color: string;
}

export interface RequestComment {
  id: string;
  author: Person;
  text: string;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  kind: "created" | "status" | "comment" | "attachment";
}

export interface WorkflowRequest {
  escalationReason?: string | null;
  sla?: RequestSla;
  resolution?: string | null;
  waitingReason?: string | null;
  closingReason?: string | null;
  incomplete?: boolean;
  id: number;
  title: string;
  description: string;
  status: RequestStatus;
  priority: RequestPriority;
  category: string;
  client: string;
  author: Person;
  assignee: Person;
  createdAt: string;
  dueAt: string;
  comments: RequestComment[];
  timeline: TimelineEvent[];
}
