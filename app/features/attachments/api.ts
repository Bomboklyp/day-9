import type { ApiCollection } from "#shared/types/api";
import type { ApiAttachment } from "#shared/types/product";
export function createAttachmentsApi(http: typeof $fetch) {
  return {
    list: (id: number) =>
      http<ApiCollection<ApiAttachment>>(`/api/requests/${id}/attachments`, {
        retry: 0,
      }),
    upload: (id: number, files: File[]) => {
      const form = new FormData();
      for (const file of files) form.append("files", file);
      return http<ApiCollection<ApiAttachment>>(
        `/api/requests/${id}/attachments`,
        { method: "POST", body: form, retry: 0 },
      );
    },
    href: (id: string) => `/api/attachments/${id}`,
  };
}
