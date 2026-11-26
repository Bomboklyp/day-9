<script setup lang="ts">
import type { WorkflowRequest } from "~/types/workflow";
defineProps<{ request: WorkflowRequest }>();
</script>
<template>
  <article class="request-card">
    <span class="request-id">#{{ request.id }}</span
    ><NuxtLink :to="'/requests/' + request.id" class="request-title">{{
      request.title
    }}</NuxtLink>
    <div class="request-meta">
      <span>{{ request.client }}</span><span>{{
        request.assignee.name === "Брунгильда Брунгильдовна"
          ? "Брунгильда Б."
          : request.assignee.name
      }}</span>
    </div>
    <div class="request-badges">
      <StatusBadge :status="request.status" /><PriorityBadge
        :priority="request.priority"
      />
    </div>
  </article>
</template>
