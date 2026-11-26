import { useAuth } from "~/features/auth/composables/useAuth";
import type { CreateRequestBody } from "#shared/types/api";
import { priorities } from "#shared/utils/request-options";

export function useRequestDraft() {
  const { user } = useAuth();
  const form = reactive<CreateRequestBody>({
    title: "",
    description: "",
    category_id: "",
    customer_id: "",
    priority: "medium",
  });
  const key = computed(
    () => `workflow-day5-draft:request:${user.value?.id ?? "guest"}`,
  );
  let ready = false;
  onMounted(() => {
    try {
      const saved: unknown = JSON.parse(
        sessionStorage.getItem(key.value) ?? "null",
      );
      if (saved && typeof saved === "object") {
        const values = saved as Record<string, unknown>;
        for (const field of [
          "title",
          "description",
          "category_id",
          "customer_id",
        ] as const) {
          const value = values[field];
          if (typeof value === "string") form[field] = value;
        }
        if (
          "priority" in saved &&
          priorities.some((item) => item.value === saved.priority)
        )
          form.priority = saved.priority as CreateRequestBody["priority"];
      }
    } catch {}
    ready = true;
  });
  watch(
    form,
    () => {
      if (ready)
        try {
          sessionStorage.setItem(key.value, JSON.stringify(form));
        } catch {}
    },
    { flush: "sync" },
  );
  function clear() {
    try {
      sessionStorage.removeItem(key.value);
    } catch {}
  }
  return { form, clear };
}
