<script setup lang="ts">
import { useAttachments } from "../composables/useAttachments";
import { attachmentLimits, attachmentHint } from "#shared/utils/attachments";
const props = defineProps<{ requestId: number; disabled?: boolean }>();
const {
  items,
  error,
  refresh,
  open,
  files,
  problem,
  busy,
  retryable,
  choose,
  show,
  upload,
} = useAttachments(props.requestId);
const picker = ref<HTMLInputElement>();
const size = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} МБ`
    : `${Math.ceil(bytes / 1024)} КБ`;
const selected = computed(() =>
  files.value.length > 1
    ? `${files.value.length} файлов выбрано`
    : files.value[0]
      ? `${files.value[0].name} · ${size(files.value[0].size)}`
      : "Выберите файл",
);
function change(event: Event) {
  choose(Array.from((event.target as HTMLInputElement).files ?? []));
}
</script>
<template>
  <section class="panel stack-16 attachment-panel">
    <h2>Вложения · {{ items.length }}</h2>
    <p v-if="error" class="form-error" role="alert">
      Не удалось загрузить вложения.
      <button class="text-button" @click="refresh()">Повторить</button>
    </p>
    <p v-else-if="!items.length" class="muted">Пока нет прикреплённых файлов</p>
    <a
      v-for="file in items"
      :key="file.id"
      :href="file.href"
      class="attachment-link"
      >{{ file.filename }} · {{ size(file.size) }}</a
    ><button
      class="button button-secondary align-start"
      :disabled="disabled || busy || items.length >= attachmentLimits.count"
      @click="show"
    >
      Добавить файл</button
    ><AppModal
      :open="open"
      :title="problem ? 'Ошибка загрузки' : 'Добавить вложения'"
      @close="!busy && (open = false)"
      ><form class="form-stack" @submit.prevent="upload">
        <p class="muted">
          {{ problem ? "Файл не был прикреплён к заявке." : attachmentHint }}
        </p>
        <label class="field"
          ><span>Файл</span
          ><span class="file-control"
            ><input
              ref="picker"
              type="file"
              multiple
              :accept="attachmentLimits.accept"
              :disabled="busy"
              aria-label="Файл"
              @change="change"
            ><span>{{ selected }}</span></span
          ></label
        >
        <p v-if="problem" class="form-error field-error" role="alert">
          {{ problem }}
        </p>
        <div class="modal-footer">
          <button
            class="button button-secondary"
            type="button"
            :disabled="busy"
            @click="open = false"
          >
            Отмена</button
          ><button
            v-if="problem && !retryable"
            class="button button-primary"
            type="button"
            @click="picker?.click()"
          >
            Выбрать другой файл</button
          ><button
            v-else
            class="button button-primary"
            :disabled="busy || !files.length"
          >
            {{
              busy
                ? "Загружаем…"
                : retryable
                  ? "Повторить загрузку"
                  : "Загрузить"
            }}
          </button>
        </div>
      </form></AppModal
    >
  </section>
</template>
