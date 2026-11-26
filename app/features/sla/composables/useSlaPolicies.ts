import { createSlaApi } from "../api";
import { useApi } from "~/composables/useApi";
export function useSlaPolicies() {
  const api = createSlaApi(useApi());
  return useAsyncData("admin-sla", () => api.list());
}
