<script setup lang="ts">
import { readRequestsQuery } from "#shared/utils/request-query";
import { apiErrorMessage } from "~/utils/api";
useHead({ title: "Обзор — WorkFlow" });
const { user } = useAuth();
const staff = computed(() => ["Operator", "Admin"].includes(user.value?.role ?? ""));
const subtitle = computed(() => ({
  Agent: "Обзор назначенной работы",
  Client: "Обзор ваших обращений",
  Admin: "Обзор сервиса",
  Operator: "Обзор работы поддержки",
})[user.value?.role ?? "Operator"]);
const { requests, stats, error, pending, refresh } = useRequests(
  readRequestsQuery({ per_page: "3" }),
  "dashboard",
);
</script>
<template>
  <div class="page-stack dashboard-page">
    <h1>Обзор</h1>
    <p class="page-subtitle">{{ subtitle }}</p>
    <RequestStats v-if="stats && staff" :stats="stats" />
    <h2 v-if="staff">Последние заявки</h2>
    <NuxtLink to="/requests" class="button button-primary align-start"
      >Все заявки</NuxtLink
    >
    <RequestState v-if="pending" state="loading" />
    <RequestState
      v-else-if="error"
      state="error"
      :message="apiErrorMessage(error)"
      @retry="refresh"
    />
    <RequestList v-else-if="requests.length" :requests="requests" />
    <RequestState v-else state="empty" @create="navigateTo('/requests')" />
  </div>
</template>
