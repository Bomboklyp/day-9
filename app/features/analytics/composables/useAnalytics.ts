import { createAnalyticsApi } from "../api";
import { useApi } from "~/composables/useApi";
export function useAnalytics() {
  const route = useRoute(),
    router = useRouter();
  const period = computed({
    get: () =>
      ["1", "7", "30"].includes(String(route.query.period))
        ? String(route.query.period)
        : "all",
    set: (value) => {
      void router.replace({ query: value === "all" ? {} : { period: value } });
    },
  });
  const api = createAnalyticsApi(useApi());
  const response = useAsyncData(
    () => `admin-analytics:${period.value}`,
    (_app, { signal }) => api.get(period.value, signal),
  );
  return { period, ...response };
}
