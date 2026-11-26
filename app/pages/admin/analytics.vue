<script setup lang="ts">
import { useAnalytics } from "~/features/analytics/composables/useAnalytics";
import { statuses } from "#shared/utils/request-options";
import { formatShortDuration } from "#shared/utils/sla";
const { data, error, pending, refresh, period } = useAnalytics();
const analytics = computed(() => data.value?.data);
const names: Record<string, string> = {
  new: "Новые",
  assigned: "Назначены",
  in_progress: "В работе",
  waiting: "Ожидание",
  resolved: "Решены",
  closed: "Закрыты",
  escalated: "Эскалированы",
};
const max = computed(() =>
  Math.max(1, ...Object.values(analytics.value?.by_status ?? {})),
);
useHead({ title: "Аналитика — WorkFlow" });
</script>
<template>
  <div class="page-stack analytics-page">
    <h1>Аналитика</h1>
    <p class="page-subtitle">Все заявки за период, включая архивные</p>
    <label class="field analytics-period"
      ><span>Период</span
      ><select v-model="period" aria-label="Период">
        <option value="all">За всё время</option>
        <option value="1">Последние 24 часа</option>
        <option value="7">Последние 7 дней</option>
        <option value="30">Последние 30 дней</option>
      </select></label
    ><RequestState
      v-if="error"
      state="error"
      title="Не удалось загрузить аналитику"
      message="Повторите запрос."
      @retry="refresh"
    /><RequestState
      v-else-if="pending && !analytics"
      state="loading"
    /><template v-else-if="analytics"
      ><div class="stats-grid">
        <StatCard label="Всего заявок" :value="analytics.total" /><StatCard
          label="Закрыто"
          :value="analytics.closed"
        /><StatCard
          label="SLA соблюдён"
          :value="
            analytics.sla_percent === null ? '—' : `${analytics.sla_percent}%`
          "
        /><StatCard
          label="Среднее решение"
          :value="
            analytics.average_resolution_minutes === null
              ? '—'
              : formatShortDuration(analytics.average_resolution_minutes)
          "
        />
      </div>
      <section class="panel analytics-section">
        <h2>Заявки по статусам</h2>
        <div class="status-chart">
          <div v-for="item in statuses" :key="item.value" class="chart-row">
            <span>{{ names[item.value] }}</span><span class="bar-track"
              ><span
                class="chart-bar"
                :style="{
                  width: `${(analytics.by_status[item.value] / max) * 100}%`,
                }" /></span
            ><span>{{ analytics.by_status[item.value] }}</span>
          </div>
        </div>
      </section>
      <section class="panel analytics-section">
        <h2>Загрузка исполнителей</h2>
        <p v-for="agent in analytics.workload" :key="agent.id">
          {{ agent.name }} — {{ agent.active }} активных заявок
        </p>
        <p v-if="!analytics.workload.length" class="muted">
          Исполнители не найдены
        </p>
      </section></template
    >
  </div>
</template>
