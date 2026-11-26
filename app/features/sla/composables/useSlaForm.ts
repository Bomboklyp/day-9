import type { SlaPolicy } from "#shared/types/product";
import { formatDuration, parseDuration } from "#shared/utils/sla";
import { createSlaApi } from "../api";
import { useApi } from "~/composables/useApi";
export function useSlaForm(policy: SlaPolicy) {
  const api = createSlaApi(useApi());
  const response = ref(formatDuration(policy.response_minutes)),
    resolution = ref(formatDuration(policy.resolution_minutes)),
    busy = ref(false),
    error = ref(""),
    saved = ref(false);
  async function save() {
    if (busy.value) return;
    error.value = "";
    saved.value = false;
    const reaction = parseDuration(response.value),
      solution = parseDuration(resolution.value);
    if (
      reaction === null ||
      solution === null ||
      reaction < 1 ||
      solution < reaction ||
      solution > 43200
    ) {
      error.value =
        "Укажите сроки от 1 минуты до 30 дней. Решение не может быть раньше реакции.";
      return;
    }
    busy.value = true;
    try {
      const result = await api.save({
        priority: policy.priority,
        response_minutes: reaction,
        resolution_minutes: solution,
      });
      response.value = formatDuration(result.data.response_minutes);
      resolution.value = formatDuration(result.data.resolution_minutes);
      saved.value = true;
    } catch {
      error.value =
        "Не удалось сохранить SLA. Введённые значения сохранены — повторите попытку.";
    } finally {
      busy.value = false;
    }
  }
  return { response, resolution, busy, error, saved, save };
}
