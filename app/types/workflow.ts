import type {
  RequestPriority,
  RequestStatus,
} from "../../shared/types/request";

export type * from "../../shared/types/workflow";

export type {
  RequestPriority,
  RequestStatus,
} from "../../shared/types/request";
export interface UserProfile {
  name: string;
  email: string;
  position: string;
  department: string;
  about: string;
  notifications: boolean;
  density: "comfortable" | "compact";
}

export interface RequestFilters {
  search: string;
  status: RequestStatus | "";
  priority: RequestPriority | "";
  sort: "newest" | "oldest" | "priority";
  assignment?: "" | "unassigned" | "mine";
}
