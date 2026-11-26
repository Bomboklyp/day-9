import { createNotificationsApi } from "../api";
import { useApi } from "~/composables/useApi";
import { apiErrorMessage } from "~/lib/api-errors";
export function useNotifications(poll = false) {
  const api = createNotificationsApi(useApi()),
    app = useNuxtApp();
  const result = useAsyncData("workflow-notifications", () => api.list(), {
    lazy: true,
  });
  const busy = ref(false),
    actionError = ref("");
  let timer: ReturnType<typeof setInterval> | undefined;
  onMounted(() => {
    if (poll)
      timer = setInterval(() => {
        void result.refresh();
      }, 30000);
  });
  onBeforeUnmount(() => clearInterval(timer));
  async function read(id?: string) {
    if (busy.value) return;
    busy.value = true;
    actionError.value = "";
    try {
      await api.read(id);
      await app.runWithContext(() => refreshNuxtData("workflow-notifications"));
    } catch (error: unknown) {
      actionError.value = apiErrorMessage(error);
    } finally {
      busy.value = false;
    }
  }
  return {
    ...result,
    busy,
    actionError,
    read,
    items: computed(() => result.data.value?.data ?? []),
    unread: computed(
      () => result.data.value?.data.filter((item) => !item.read_at).length ?? 0,
    ),
  };
}
