import { useDebounce } from "~/composables/useDebounce";
import type { RequestFilters } from "~/types/workflow";
import {
  readRequestsQuery,
  requestsUrlQuery,
} from "#shared/utils/request-query";

export function useRequestQuery() {
  const route = useRoute();
  const router = useRouter();
  const query = computed(() => readRequestsQuery(route.query));
  const fromRoute = (): RequestFilters => ({
    search: query.value.q,
    status: query.value.status,
    priority: query.value.priority,
    assignment: query.value.assignment,
    sort: query.value.sort,
  });
  const filters = ref<RequestFilters>(fromRoute());
  const search = useDebounce(() => filters.value.search, 350);
  watch(
    () => route.query,
    (_next, previous) => {
      const next = fromRoute();
      const previousSearch = readRequestsQuery(previous).q;
      if (
        query.value.q === previousSearch &&
        filters.value.search.trim() !== previousSearch
      )
        next.search = filters.value.search;
      filters.value = next;
    },
  );
  watch(search, (text) => {
    if (text !== filters.value.search || text.trim() === query.value.q) return;
    void router.replace({
      query: requestsUrlQuery({ ...query.value, q: text.trim(), page: 1 }),
    });
  });
  watch(
    () => [
      filters.value.status,
      filters.value.priority,
      filters.value.assignment,
      filters.value.sort,
    ],
    () => {
      const f = filters.value;
      const q = query.value;
      if (
        f.status === q.status &&
        f.priority === q.priority &&
        (f.assignment ?? "") === q.assignment &&
        f.sort === q.sort
      )
        return;
      void router.push({
        query: requestsUrlQuery({
          ...q,
          status: f.status,
          priority: f.priority,
          assignment: f.assignment ?? "",
          sort: f.sort,
          page: 1,
        }),
      });
    },
  );
  function setPage(page: number) {
    return router.push({ query: requestsUrlQuery({ ...query.value, page }) });
  }
  function reset() {
    filters.value.search = "";
    return router.push({ query: {} });
  }
  function retry(refresh: () => Promise<unknown>) {
    return refresh();
  }
  return { query, filters, setPage, reset, retry };
}
