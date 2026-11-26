import type { ApiUser } from "#shared/types/api";
import type { UserOption } from "./types";
export function mapUserOption(user: ApiUser): UserOption {
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    isActive: user.is_active !== false,
  };
}
