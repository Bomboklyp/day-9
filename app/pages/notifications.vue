<script setup lang="ts">
import { useNotifications } from "~/features/notifications/composables/useNotifications";
const { items, unread, error, status, refresh, read, busy, actionError } =
  useNotifications();
const date = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Moscow",
  }).format(new Date(value));
useHead({ title: "Уведомления — WorkFlow" });
</script>
<template>
  <div class="page-stack notifications-page">
    <h1>Уведомления</h1>
    <p class="page-subtitle">Назначения, эскалации и приближение срока</p>
    <button
      class="button button-secondary align-start"
      :disabled="busy || !unread"
      @click="read()"
    >
      Отметить всё прочитанным
    </button>
    <p v-if="actionError" class="form-error" role="alert">{{ actionError }}</p>
    <RequestState
      v-if="error"
      state="error"
      title="Не удалось загрузить уведомления"
      message="Повторите запрос."
      @retry="refresh"
    /><RequestState
      v-else-if="status === 'pending' && !items.length"
      state="loading"
    />
    <section v-else-if="!items.length" class="panel notification-card">
      <h2>Новых уведомлений нет</h2>
      <p class="muted">Здесь появятся сообщения о заявках и сроках.</p>
    </section>
    <section
      v-for="item in items"
      v-else
      :key="item.id"
      class="panel notification-card"
      :class="{ 'notification-unread': !item.read_at }"
    >
      <h3>{{ item.title }}</h3>
      <p>{{ item.message }}</p>
      <p class="muted notification-time">{{ date(item.created_at) }}</p>
      <NuxtLink
        :to="`/requests/${item.request_id}`"
        class="button button-tertiary align-start"
        @click="read(item.id)"
        >Открыть заявку</NuxtLink
      >
    </section>
  </div>
</template>
