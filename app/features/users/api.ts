import type { ApiCollection, ApiUser } from "#shared/types/api";
export function createUsersApi(http: typeof $fetch) {
  return {
    list: (signal?: AbortSignal) =>
      http<ApiCollection<ApiUser>>("/api/users", { signal, retry: 0 }),
  };
}
