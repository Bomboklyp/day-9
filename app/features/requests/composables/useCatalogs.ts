import type { ApiCatalogs } from "#shared/types/api";
import { useApi } from "~/composables/useApi";
import { createUsersApi } from "~/features/users/api";
import { createCustomersApi } from "~/features/customers/api";
import { createRequestsApi } from "../api";
export function useCatalogs() {
  const http = useApi();
  const usersApi = createUsersApi(http),
    customersApi = createCustomersApi(http),
    requestsApi = createRequestsApi(http);
  return useAsyncData<ApiCatalogs>(
    "workflow-api-catalogs",
    async (_app, { signal }) => {
      const [users, customers, categories] = await Promise.all([
        usersApi.list(signal),
        customersApi.list(signal),
        requestsApi.categories(signal),
      ]);
      return {
        users: users.data,
        customers: customers.data,
        categories: categories.data,
      };
    },
    { lazy: true },
  );
}
