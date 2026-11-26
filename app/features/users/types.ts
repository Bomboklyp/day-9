import type { Role } from "#shared/types/auth";
export interface UserOption {
  id: string;
  name: string;
  role?: Role;
  isActive: boolean;
}
