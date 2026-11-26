import type { ApiItem } from "#shared/types/api";
import type { Analytics } from "#shared/types/product";
export function createAnalyticsApi(http: typeof $fetch) {
  return {
    get: (period: string, signal?: AbortSignal) =>
      http<ApiItem<Analytics>>("/api/admin/analytics", {
        query: { period },
        signal,
        retry: 0,
      }),
  };
}
