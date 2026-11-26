import { useCommentActions } from "./useCommentActions";
import { useAuth } from "~/features/auth/composables/useAuth";
import { useRequestUiStore } from "~/features/requests/state/requestUi";
import type { MaybeRefOrGetter } from "vue";
import { apiErrorMessage } from "~/lib/api-errors";

export function useCommentForm(id: MaybeRefOrGetter<number>) {
  const auth = useAuth(),
    ui = useRequestUiStore();
  const { addComment } = useCommentActions();
  const text = ref(""),
    error = ref(""),
    busy = ref(false);
  const clientId = ref(""),
    submittedText = ref("");
  const key = computed(
    () =>
      `workflow-day5-draft:comment:${auth.user.value?.id ?? "guest"}:${toValue(id)}`,
  );
  let ready = false;
  function restore() {
    ready = false;
    text.value = "";
    clientId.value = "";
    submittedText.value = "";
    try {
      const saved: unknown = JSON.parse(
        sessionStorage.getItem(key.value) ?? "null",
      );
      if (
        saved &&
        typeof saved === "object" &&
        "text" in saved &&
        typeof saved.text === "string"
      ) {
        text.value = saved.text.slice(0, 2000);
        if ("clientId" in saved && typeof saved.clientId === "string")
          clientId.value = saved.clientId;
        if ("submittedText" in saved && typeof saved.submittedText === "string")
          submittedText.value = saved.submittedText;
      }
    } catch {}
    ready = true;
  }
  onMounted(restore);
  watch(key, restore);
  watch(
    [text, clientId, submittedText],
    () => {
      if (!ready) return;
      try {
        if (!text.value) sessionStorage.removeItem(key.value);
        else
          sessionStorage.setItem(
            key.value,
            JSON.stringify({
              text: text.value,
              clientId: clientId.value,
              submittedText: submittedText.value,
            }),
          );
      } catch {}
    },
    { flush: "sync" },
  );
  async function submit() {
    if (busy.value || ui.pending[toValue(id)] || !text.value.trim())
      return false;
    if (!clientId.value || submittedText.value !== text.value.trim()) {
      submittedText.value = text.value.trim();
      clientId.value = crypto.randomUUID();
    }
    busy.value = true;
    error.value = "";
    const version = auth.version.value;
    try {
      await addComment(toValue(id), submittedText.value, clientId.value);
      if (version !== auth.version.value) return false;
      text.value = "";
      clientId.value = "";
      submittedText.value = "";
      return true;
    } catch (cause: unknown) {
      if (version === auth.version.value)
        error.value = `${apiErrorMessage(cause)} Текст сохранён — попробуйте ещё раз.`;
      return false;
    } finally {
      busy.value = false;
    }
  }
  return { text, error, busy, submit };
}
