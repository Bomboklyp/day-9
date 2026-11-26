import type {
  ApiItem,
  ApiRequest,
  ApiRequestsResponse,
} from "../../../../shared/types/api";

type RequestCache = ApiItem<ApiRequest> | ApiRequestsResponse;
export function useRequestCache() {
  const app = useNuxtApp();
  function visit(update: (value: RequestCache) => RequestCache) {
    for (const key of Object.keys(app.payload.data).filter(
      (key) =>
        key.startsWith("workflow-request:") ||
        key.startsWith("workflow-requests:"),
    )) {
      app.runWithContext(() => {
        const { data } = useNuxtData<RequestCache>(key);
        if (data.value) data.value = update(data.value);
      });
    }
  }
  function find(id: number): ApiRequest | undefined {
    let found: ApiRequest | undefined;
    visit((value) => {
      const candidate =
        "meta" in value
          ? value.data.find((request) => request.id === id)
          : value.data.id === id
            ? value.data
            : undefined;
      if (
        candidate &&
        (!found || (candidate.revision ?? 1) >= (found.revision ?? 1))
      )
        found = candidate;
      return value;
    });
    return found;
  }
  async function commit(record: ApiRequest) {
    const previous = find(record.id);
    if ((previous?.revision ?? 0) > (record.revision ?? 0)) return;
    visit((value) => {
      if ("meta" in value) {
        const stats = { ...value.stats };
        if (previous && previous.status !== record.status) {
          for (const status of [
            "new",
            "in_progress",
            "waiting",
            "resolved",
          ] as const) {
            stats[status] = Math.max(
              0,
              stats[status] +
                Number(record.status === status) -
                Number(previous.status === status),
            );
          }
        }
        return {
          ...value,
          stats,
          data: value.data.map((request) =>
            request.id === record.id ? record : request,
          ),
        };
      }
      return value.data.id === record.id ? { data: record } : value;
    });
    await app.runWithContext(() =>
      refreshNuxtData(
        Object.keys(app.payload.data).filter((key) =>
          key.startsWith("workflow-requests:"),
        ),
      ),
    );
  }
  return { find, commit };
}
