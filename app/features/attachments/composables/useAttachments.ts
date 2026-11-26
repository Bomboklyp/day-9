import { createAttachmentsApi } from "../api";
import { useApi } from "~/composables/useApi";
import { attachmentProblem } from "#shared/utils/attachments";
import { apiErrorMessage, apiErrorStatus } from "~/lib/api-errors";
export function useAttachments(id: number) {
  const api = createAttachmentsApi(useApi()),
    app = useNuxtApp();
  const result = useAsyncData(
    `workflow-attachments:${id}`,
    () => api.list(id),
    { lazy: true },
  );
  const open = ref(false),
    files = ref<File[]>([]),
    problem = ref(""),
    busy = ref(false),
    retryable = ref(false);
  const items = computed(() =>
    (result.data.value?.data ?? []).map((file) => ({
      ...file,
      href: api.href(file.id),
    })),
  );
  function choose(selected: File[]) {
    files.value = selected;
    problem.value = attachmentProblem(selected, items.value.length) ?? "";
    retryable.value = false;
  }
  function show() {
    files.value = [];
    problem.value = "";
    retryable.value = false;
    open.value = true;
  }
  async function upload() {
    if (busy.value || !files.value.length) return;
    problem.value = attachmentProblem(files.value, items.value.length) ?? "";
    if (problem.value) return;
    busy.value = true;
    try {
      await api.upload(id, files.value);
      await result.refresh();
      await app.runWithContext(() => refreshNuxtData(`workflow-request:${id}`));
      open.value = false;
      files.value = [];
    } catch (error: unknown) {
      problem.value = apiErrorMessage(error);
      retryable.value = apiErrorStatus(error) >= 500;
    } finally {
      busy.value = false;
    }
  }
  return {
    ...result,
    items,
    open,
    files,
    problem,
    busy,
    retryable,
    choose,
    show,
    upload,
  };
}
