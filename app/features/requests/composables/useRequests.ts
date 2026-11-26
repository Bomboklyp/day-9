import { mapUserOption } from "~/features/users/mapUser";
import { createRequestsApi } from "../api";
import { useAuth } from "~/features/auth/composables/useAuth";
import { useApi } from "~/composables/useApi";
import { useCatalogs } from "~/features/requests/composables/useCatalogs";
import type { MaybeRefOrGetter } from "vue";
import type {
  ApiItem,
  ApiRequest,
  ApiRequestsResponse,
  RequestsQuery,
} from "../../../../shared/types/api";
import { mapApiRequest } from "~/features/requests/mapRequest";
import { useRequestUiStore } from "~/features/requests/state/requestUi";

export function useRequests(
  query: MaybeRefOrGetter<RequestsQuery>,
  scope = "list",
) {
  const ui = useRequestUiStore();
  const catalogs = useCatalogs();
  const api = createRequestsApi(useApi()),
    { user } = useAuth();
  const response = useAsyncData<ApiRequestsResponse>(
    () => `workflow-requests:${scope}:${user.value?.id ?? "guest"}`,
    (_app, { signal }) => api.list(toValue(query), signal),
    { lazy: true, dedupe: "cancel" },
  );
  watch(
    () => JSON.stringify(toValue(query)),
    () => {
      void response.refresh({ dedupe: "cancel" });
    },
  );
  const error = computed(() => response.error.value ?? catalogs.error.value);
  const pending = computed(
    () =>
      response.status.value === "pending" ||
      catalogs.status.value === "pending",
  );
  const requests = computed(() =>
    catalogs.data.value
      ? (response.data.value?.data ?? []).map((request) =>
          mapApiRequest(
            {
              ...request,
              priority:
                ui.priorityChanges[request.id]?.after ?? request.priority,
            },
            catalogs.data.value!,
          ),
        )
      : [],
  );
  return {
    requests,
    meta: computed(() => response.data.value?.meta),
    stats: computed(() => response.data.value?.stats),
    error,
    pending,
    refresh: () => Promise.all([response.refresh(), catalogs.refresh()]),
  };
}
export function useRequest(id: MaybeRefOrGetter<string>) {
  const ui = useRequestUiStore();
  const catalogs = useCatalogs();
  const api = createRequestsApi(useApi());
  const response = useAsyncData<ApiItem<ApiRequest>>(
    () => `workflow-request:${toValue(id)}`,
    (_app, { signal }) => api.get(toValue(id), signal),
    { lazy: true, dedupe: "cancel" },
  );
  return {
    response,
    request: computed(() =>
      response.data.value?.data && catalogs.data.value
        ? mapApiRequest(
            {
              ...response.data.value.data,
              priority:
                ui.priorityChanges[response.data.value.data.id]?.after ??
                response.data.value.data.priority,
            },
            catalogs.data.value,
          )
        : undefined,
    ),
    users: computed(() =>
      (catalogs.data.value?.users ?? []).map(mapUserOption),
    ),
    error: computed(() => response.error.value ?? catalogs.error.value),
    pending: computed(
      () =>
        response.status.value === "pending" ||
        catalogs.status.value === "pending",
    ),
    refresh: () => Promise.all([response.refresh(), catalogs.refresh()]),
  };
}
