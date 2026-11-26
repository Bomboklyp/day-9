<script setup lang="ts">
import type { WorkflowRequest } from "~/types/workflow";
defineProps<{ requests: WorkflowRequest[] }>();
</script>
<template>
  <div class="request-list panel">
    <div class="desktop-request-list">
      <div class="request-table-head request-columns" aria-hidden="true">
        <span>Номер</span><span>Заявка</span
        ><span class="request-client">Клиент</span
        ><span class="request-assignee">Исполнитель</span><span>Статус</span
        ><span>Приоритет</span>
      </div>
      <ul>
        <li
          v-for="request in requests"
          :key="request.id"
          class="request-row request-columns"
        >
          <NuxtLink
            :to="'/requests/' + request.id"
            class="request-id"
            :aria-label="'Заявка ' + request.id"
            >#{{ request.id }}</NuxtLink
          ><NuxtLink :to="'/requests/' + request.id" class="request-title">{{
            request.title
          }}</NuxtLink
          ><span class="request-client">{{ request.client }}</span
          ><span class="request-assignee">{{
            request.assignee.name === "Брунгильда Брунгильдовна"
              ? "Брунгильда Б."
              : request.assignee.name
          }}</span
          ><StatusBadge :status="request.status" /><PriorityBadge
            :priority="request.priority"
          />
        </li>
      </ul>
    </div>
    <ul class="mobile-request-list">
      <li v-for="request in requests" :key="request.id">
        <RequestCard :request="request" />
      </li>
    </ul>
  </div>
</template>
