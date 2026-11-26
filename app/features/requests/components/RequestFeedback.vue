<script setup lang="ts">
import { useRequestActions } from "~/features/requests/composables/useRequestActions";
import { useRequestUiStore } from "~/features/requests/state/requestUi";
const props = defineProps<{ requestId?: number }>();
const emit = defineEmits<{ refresh: [] }>();
const ui = useRequestUiStore();
const { undoLastChange } = useRequestActions();
const notice = computed(() =>
  ui.notice &&
  (props.requestId === undefined || props.requestId === ui.notice.requestId)
    ? ui.notice
    : null,
);
const canUndo = computed(
  () =>
    ui.undo?.id === notice.value?.requestId && notice.value?.kind === "success",
);
function refresh() {
  ui.notice = null;
  emit("refresh");
}
</script>
<template>
  <section
    v-if="notice"
    class="panel request-feedback"
    :class="{ 'feedback-error': notice.kind === 'error' }"
    :role="notice.kind === 'error' ? 'alert' : 'status'"
  >
    <h2>
      {{ notice.kind === "error" ? "Изменение не сохранено" : notice.message }}
    </h2>
    <p v-if="notice.kind === 'error'">{{ notice.message }}</p>
    <button
      v-if="canUndo"
      class="button button-secondary align-start"
      :disabled="!!ui.pending[notice.requestId]"
      @click="undoLastChange"
    >
      Отменить изменение
    </button>
    <button
      v-if="notice.kind === 'error'"
      class="button button-secondary align-start"
      :disabled="!!ui.pending[notice.requestId]"
      @click="refresh"
    >
      Обновить заявку
    </button>
  </section>
</template>
