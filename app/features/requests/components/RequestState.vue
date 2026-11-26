<script setup lang="ts">
defineProps<{
  state: "loading" | "empty" | "error";
  filtered?: boolean;
  hideCreate?: boolean;
  message?: string;
  title?: string;
}>();
const emit = defineEmits<{ retry: []; create: [] }>();
</script>
<template>
  <div
    v-if="state === 'loading'"
    class="loading-state panel"
    role="status"
    aria-label="Загрузка заявок"
    aria-busy="true"
  >
    <p>Загружаем заявки…</p>
    <div
      v-for="index in 6"
      :key="index"
      class="skeleton-row"
      aria-hidden="true"
    >
      —&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      —&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
      —
    </div>
  </div>
  <section
    v-else
    class="list-state panel"
    :role="state === 'error' ? 'alert' : 'status'"
  >
    <AppIcon :name="state === 'error' ? 'warning' : 'empty'" :size="20" />
    <h2>
      {{
        title ||
        (state === "error"
          ? "Не удалось загрузить заявки"
          : filtered
            ? "Заявки не найдены"
            : "Заявок пока нет")
      }}
    </h2>
    <p>
      {{
        message ||
        (state === "error"
          ? "Сервис временно недоступен. Попробуйте ещё раз."
          : filtered
            ? "Измените параметры поиска."
            : "Обращения появятся здесь после создания.")
      }}
    </p>
    <button
      v-if="state === 'error' || filtered"
      class="button button-primary"
      @click="emit('retry')"
    >
      {{
        state === "error" ? "Повторить загрузку" : "Сбросить фильтры"
      }}</button><button
      v-else-if="!hideCreate"
      class="button button-primary"
      @click="emit('create')"
    >
      Создать заявку
    </button>
  </section>
</template>
