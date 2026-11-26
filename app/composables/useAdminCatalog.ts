import { useApi } from "./useApi";
import { createUsersApi } from "~/features/users/api";
import { createRequestsApi } from "~/features/requests/api";
export function useAdminCatalog(mode: "users" | "categories") {
  const http = useApi();
  return useAsyncData(`admin-catalog:${mode}`, async () =>
    mode === "users"
      ? (await createUsersApi(http).list()).data.map((person) => ({
          id: person.id,
          name: person.name,
          detail: `${person.role} · ${person.is_active ? "Активен" : "Деактивирован"}`,
        }))
      : (await createRequestsApi(http).categories()).data.map((item) => ({
          ...item,
          detail: "",
        })),
  );
}
