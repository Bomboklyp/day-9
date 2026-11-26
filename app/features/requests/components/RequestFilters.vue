<script setup lang="ts">
import type { RequestFilters } from "~/types/workflow";
import { statuses, priorities } from "~/utils/requests";
const model = defineModel<RequestFilters>({ required: true });
withDefaults(defineProps<{ simple?: boolean; hideAssignment?: boolean }>(), {
  simple: false,
  hideAssignment: false,
});
const id = useId();
</script>
<template>
  <div
    class="request-filters"
    :class="{
      'filters-simple': simple,
      'filters-no-assignment': hideAssignment,
    }"
    role="search"
    aria-label="Фильтры заявок"
  >
    <label class="field search-field" :for="id + '-search'"
      ><span>Поиск</span
      ><input
        :id="id + '-search'"
        v-model="model.search"
        type="search"
        placeholder="Номер или название заявки" ></label
    ><label class="field" :for="id + '-status'"
      ><span>Статус</span
      ><select :id="id + '-status'" v-model="model.status" aria-label="Статус">
        <option value="">Все статусы</option>
        <option
          v-for="status in statuses"
          :key="status.value"
          :value="status.value"
        >
          {{ status.label }}
        </option>
      </select></label
    ><label class="field" :for="id + '-priority'"
      ><span>Приоритет</span
      ><select
        :id="id + '-priority'"
        v-model="model.priority"
        aria-label="Приоритет"
      >
        <option value="">Все приоритеты</option>
        <option
          v-for="priority in priorities"
          :key="priority.value"
          :value="priority.value"
        >
          {{ priority.label }}
        </option>
      </select></label
    ><label
      v-if="!simple && !hideAssignment"
      class="field"
      :for="id + '-assignment'"
      ><span>Назначение</span
      ><select
        :id="id + '-assignment'"
        v-model="model.assignment"
        aria-label="Назначение"
      >
        <option value="">Все заявки</option>
        <option value="unassigned">Не назначены</option>
        <option value="mine">Назначены мне</option>
      </select></label
    ><label v-if="!simple" class="field" :for="id + '-sort'"
      ><span>Сортировка</span
      ><select :id="id + '-sort'" v-model="model.sort" aria-label="Сортировка">
        <option value="newest">Сначала новые</option>
        <option value="oldest">Сначала старые</option>
        <option value="priority">По приоритету</option>
      </select></label
    >
  </div>
</template>
