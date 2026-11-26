<script setup lang="ts">
import { useSlaPolicies } from "~/features/sla/composables/useSlaPolicies";
const { data, error, status, refresh } = await useSlaPolicies();
useHead({ title: "Настройки SLA — WorkFlow" });
</script>
<template>
  <div class="page-stack sla-page">
    <h1>Настройки SLA</h1>
    <p class="page-subtitle">Сроки реакции и решения для каждого приоритета</p>
    <RequestState
      v-if="error"
      state="error"
      title="Не удалось загрузить SLA"
      message="Повторите запрос."
      @retry="refresh"
    /><RequestState
      v-else-if="status === 'pending'"
      state="loading"
    /><SlaPolicyCard
      v-for="policy in data?.data ?? []"
      v-else
      :key="policy.priority"
      :policy="policy"
    />
  </div>
</template>
