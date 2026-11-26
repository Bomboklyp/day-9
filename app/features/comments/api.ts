import type { ApiItem, ApiRequest, CreateCommentBody } from "#shared/types/api";
export function createCommentsApi(http: typeof $fetch) {
  return {
    add: (body: CreateCommentBody) =>
      http<ApiItem<ApiRequest>>("/api/comments", {
        method: "POST",
        body,
        retry: 0,
      }),
  };
}
