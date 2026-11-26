<script setup lang="ts">
import { useRequestQuery } from "~/features/requests/composables/useRequestQuery";
import { useRequests } from "~/features/requests/composables/useRequests";
import { useAuth } from "~/features/auth/composables/useAuth";
import { useProfile as useWorkflow } from "~/features/users/composables/useProfile";
import { apiErrorMessage } from "~/lib/api-errors";
import { useRequestUiStore } from "~/features/requests/state/requestUi";
useHead({ title: "Заявки — WorkFlow" });
const { query, filters, setPage, reset, retry } = useRequestQuery();
const { requests, meta, stats, error, pending, refresh } = useRequests(query);
const { user } = useAuth();
const isStaff = computed(
  () => user.value?.role === "Operator" || user.value?.role === "Admin",
);
const canCreate = computed(() => user.value?.role !== "Agent");
const ui = useRequestUiStore();
const { profile } = useWorkflow();
const feedbackView = computed(() => ui.notice !== null);
const incomplete = computed(() =>
  requests.value.some((request) => request.incomplete),
);
const hasFilters = computed(() =>
  Boolean(
    query.value.q ||
    query.value.status ||
    query.value.priority ||
    query.value.assignment,
  ),
);
const state = computed(() =>
  pending.value
    ? "loading"
    : error.value
      ? "error"
      : !requests.value.length
        ? "empty"
        : "success",
);
watch([meta, pending], ([pagination, loading]) => {
  if (pagination && !loading && pagination.page !== query.value.page)
    void setPage(pagination.page);
});
</script>
<template>
  <div
    class="page-stack requests-page"
    :class="{ 'requests-state-page': state !== 'success' }"
    :aria-busy="pending"
  >
    <h1>
      {{
        user?.role === "Client"
          ? "Мои заявки"
          : user?.role === "Agent"
            ? "Заявки"
            : state === "success" && !feedbackView
              ? "Рабочий день под контролем"
              : "Заявки"
      }}
    </h1>
    <p class="page-subtitle">
      {{
        user?.role === "Agent"
          ? "Назначенные вам обращения"
          : isStaff && state === "success" && !feedbackView
            ? "Заявки, которые требуют вашего внимания"
            : "Все обращения в одном месте"
      }}
    </p>
    <RequestFeedback @refresh="refresh" />
    <p v-if="profile.density === 'compact'" class="density-notice">
      Плотность списка: компактная
    </p>
    <div v-if="state === 'success' && query.q" class="search-summary">
      <span>По запросу «{{ query.q }}» найдено: {{ meta?.total ?? 0 }}</span
      ><button class="button button-secondary" @click="filters.search = ''">
        Сбросить поиск
      </button>
    </div>
    <p
      v-if="state === 'success' && incomplete"
      class="api-notice"
      role="status"
    >
      Часть данных заявки недоступна. Остальные обращения отображаются.
    </p>
    <RequestStats
      v-if="state === 'success' && stats && !feedbackView && isStaff"
      :stats="stats"
    />
    <h2 v-if="state === 'success' && !feedbackView && isStaff">Заявки</h2>
    <NuxtLink
      v-if="canCreate"
      :to="{ path: '/requests/new', query: $route.query }"
      class="button button-primary align-start"
      >Создать заявку</NuxtLink
    >
    <RequestFilters
      v-model="filters"
      :hide-assignment="!isStaff"
      :simple="feedbackView || (state !== 'success' && !hasFilters)"
    />
    <RequestState v-if="state === 'loading'" state="loading" />
    <RequestState
      v-else-if="state === 'error'"
      state="error"
      :message="apiErrorMessage(error)"
      @retry="retry(refresh)"
    />
    <RequestState
      v-else-if="state === 'empty'"
      state="empty"
      :filtered="hasFilters"
      :hide-create="!canCreate"
      :title="hasFilters ? 'Ничего не найдено' : undefined"
      :message="
        hasFilters
          ? 'Попробуйте изменить запрос или сбросить фильтры.'
          : undefined
      "
      @retry="reset"
      @create="navigateTo('/requests/new')"
    />
    <RequestList v-else :requests="requests" />
    <nav
      v-if="state === 'success' && meta"
      class="pagination"
      aria-label="Страницы заявок"
    >
      <p>
        Показано {{ (meta.page - 1) * meta.per_page + 1 }}–{{
          Math.min(meta.page * meta.per_page, meta.total)
        }}
        из {{ meta.total }}
      </p>
      <template v-if="meta.total_pages > 1">
        <button
          class="button button-secondary"
          :disabled="meta.page === 1 || pending"
          @click="setPage(meta.page - 1)"
        >
          Назад
        </button>
        <button
          v-for="number in meta.total_pages"
          :key="number"
          class="button"
          :class="meta.page === number ? 'button-primary' : 'button-secondary'"
          :disabled="pending"
          :aria-current="meta.page === number ? 'page' : undefined"
          :aria-label="'Страница ' + number"
          @click="setPage(number)"
        >
          {{ number }}
        </button>
        <button
          class="button button-secondary"
          :disabled="meta.page === meta.total_pages || pending"
          @click="setPage(meta.page + 1)"
        >
          Далее
        </button>
      </template>
    </nav>
  </div>
</template>
