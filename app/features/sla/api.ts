import type { ApiCollection, ApiItem } from "#shared/types/api";
import type { SlaPolicy } from "#shared/types/product";
export function createSlaApi(http: typeof $fetch) {
  return {
    list: () => http<ApiCollection<SlaPolicy>>("/api/admin/sla", { retry: 0 }),
    save: (policy: SlaPolicy) =>
      http<ApiItem<SlaPolicy>>(`/api/admin/sla/${policy.priority}`, {
        method: "PATCH",
        body: {
          response_minutes: policy.response_minutes,
          resolution_minutes: policy.resolution_minutes,
        },
        retry: 0,
      }),
  };
}
