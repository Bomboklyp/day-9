<script setup lang="ts">
import { useRequestUiStore } from "~/features/requests/state/requestUi";
import { useCommentForm } from "~/features/comments/composables/useCommentForm";
import { useToast } from "~/features/notifications/composables/useToast";
import type { WorkflowRequest } from "~/types/workflow";
const props = defineProps<{ request: WorkflowRequest }>();
const { notify } = useToast();
const form = useCommentForm(() => props.request.id);
const { text, error, busy } = form;
const ui = useRequestUiStore();
const locked = computed(() => busy.value || !!ui.pending[props.request.id]);
const id = useId();
const time = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Moscow",
  }).format(new Date(value));
async function submit() {
  if (await form.submit()) notify("Комментарий отправлен");
}
</script>
<template>
  <section class="panel comments-panel stack-16">
    <h2>Комментарии · {{ request.comments.length }}</h2>
    <article
      v-for="comment in request.comments"
      :key="comment.id"
      class="comment"
    >
      <p class="comment-author">
        {{ comment.author.name }} · {{ time(comment.createdAt) }}
      </p>
      <p>{{ comment.text }}</p>
    </article>
    <form class="stack-16" @submit.prevent="submit">
      <label class="field textarea-field" :for="id"
        ><span>Ваш комментарий</span
        ><textarea
          :id="id"
          v-model="text"
          maxlength="2000"
          :disabled="locked"
          placeholder="Напишите сообщение…"
          @keydown.ctrl.enter.prevent="submit"
        />
      </label>
      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <button
        class="button button-primary align-start"
        type="submit"
        :disabled="locked || !text.trim()"
      >
        {{
          busy
            ? "Отправляем…"
            : error
              ? "Повторить отправку"
              : "Отправить комментарий"
        }}
      </button>
      <p v-if="busy" class="field-hint" role="status">
        Отправляем комментарий…
      </p>
    </form>
  </section>
</template>
