<script setup lang="ts">
import type { ApiStats } from "../../../../shared/types/api";
const props = defineProps<{ stats: ApiStats }>();
const cards = computed(() => [
  {
    label: "Новые заявки",
    value: props.stats.new,
    description: "Ожидают назначения",
  },
  {
    label: "В работе",
    value: props.stats.in_progress,
    description: "Назначены исполнителям",
  },
  {
    label: "Ожидают ответа",
    value: props.stats.waiting,
    description: "Нужна информация",
  },
  {
    label: "Решены",
    value: props.stats.resolved,
    description: "За эту неделю",
  },
]);
</script>
<template>
  <div class="stats-grid">
    <StatCard v-for="card in cards" :key="card.label" v-bind="card" />
  </div>
</template>
