import { useAuth } from "~/features/auth/composables/useAuth";
import { useRequestUiStore } from "~/features/requests/state/requestUi";
import { useRequestCache } from "~/features/requests/composables/useRequestCache";
import { useApi } from "~/composables/useApi";
import { createCommentsApi } from "../api";
export function useCommentActions() {
  const auth = useAuth(),
    ui = useRequestUiStore(),
    cache = useRequestCache();
  const api = createCommentsApi(useApi());
  async function addComment(id: number, text: string, clientId: string) {
    const version = auth.version.value;
    const sequence = ui.begin(id);
    if (!sequence) throw new Error("Request mutation already in progress");
    try {
      const result = await api.add({
        text,
        request_id: id,
        client_id: clientId,
      });
      if (version !== auth.version.value) return result.data;
      await cache.commit(result.data);
      if (version !== auth.version.value) return result.data;
      return result.data;
    } finally {
      if (version === auth.version.value) ui.finish(id, sequence);
    }
  }
  return { addComment };
}
