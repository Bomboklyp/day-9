<script setup lang="ts">
import type { SlaPolicy } from "#shared/types/product";
import { useSlaForm } from "../composables/useSlaForm";
import { priorities } from "#shared/utils/request-options";
const props = defineProps<{ policy: SlaPolicy }>();
const { response, resolution, busy, error, saved, save } = useSlaForm(
  props.policy,
);
const name = computed(
  () => priorities.find((item) => item.value === props.policy.priority)!.label,
);
</script>
<template>
  <form
    class="panel sla-card"
    :aria-label="`SLA: ${name}`"
    novalidate
    @submit.prevent="save"
  >
    <PriorityBadge :priority="policy.priority" />
    <div class="sla-fields">
      <label class="field"
        ><span>Время реакции</span
        ><input
          v-model="response"
          :aria-label="`Время реакции: ${name}`"
          :disabled="busy"
          required ></label
      ><label class="field"
        ><span>Время решения</span
        ><input
          v-model="resolution"
          :aria-label="`Время решения: ${name}`"
          :disabled="busy"
          required
      ></label>
    </div>
    <p v-if="error" class="form-error" role="alert">{{ error }}</p>
    <button class="button button-secondary align-start" :disabled="busy">
      {{ busy ? "Сохраняем…" : error ? "Повторить сохранение" : "Сохранить" }}
    </button>
    <p v-if="busy" class="muted" role="status">
      Сохраняем сроки для {{ name.toLowerCase() }} приоритета…
    </p>
    <p v-if="saved" class="muted" role="status">Настройки SLA сохранены.</p>
  </form>
</template>
