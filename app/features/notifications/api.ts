import type { ApiCollection } from "#shared/types/api";
import type { ApiNotification } from "#shared/types/product";
export function createNotificationsApi(http: typeof $fetch) {
  return {
    list: () =>
      http<ApiCollection<ApiNotification>>("/api/notifications", { retry: 0 }),
    read: (id?: string) =>
      http<{ ok: boolean }>("/api/notifications/read", {
        method: "PATCH",
        body: id ? { id } : {},
        retry: 0,
      }),
  };
}
