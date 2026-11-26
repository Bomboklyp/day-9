import type { ApiCollection, ApiCustomer } from "#shared/types/api";
export function createCustomersApi(http: typeof $fetch) {
  return {
    list: (signal?: AbortSignal) =>
      http<ApiCollection<ApiCustomer>>("/api/customers", { signal, retry: 0 }),
  };
}
