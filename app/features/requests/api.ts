import type {
  ApiItem,
  ApiRequest,
  ApiRequestsResponse,
  ApiCollection,
  ApiCategory,
  CreateRequestBody,
  UpdateRequestBody,
  RequestsQuery,
} from "#shared/types/api";
export function createRequestsApi(http: typeof $fetch) {
  return {
    list: (query: RequestsQuery, signal?: AbortSignal) =>
      http<ApiRequestsResponse>("/api/requests", {
        query: { ...query },
        signal,
        retry: 0,
      }),
    get: (id: number | string, signal?: AbortSignal) =>
      http<ApiItem<ApiRequest>>(`/api/requests/${id}`, { signal, retry: 0 }),
    create: (body: CreateRequestBody) =>
      http<ApiItem<ApiRequest>>("/api/requests", {
        method: "POST",
        body,
        retry: 0,
      }),
    update: (id: number, body: UpdateRequestBody) =>
      http<ApiItem<ApiRequest>>(`/api/requests/${id}`, {
        method: "PATCH",
        body,
        retry: 0,
      }),
    categories: (signal?: AbortSignal) =>
      http<ApiCollection<ApiCategory>>("/api/categories", { signal, retry: 0 }),
  };
}
