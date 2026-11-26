export const roles = ["Client", "Operator", "Agent", "Admin"] as const;
export type Role = (typeof roles)[number];
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  is_active: boolean;
  customer_id: string | null;
}
export interface AuthSession {
  user: SessionUser | null;
}
