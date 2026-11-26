<script setup lang="ts">
import type { RequestPriority } from "~/types/workflow";
import { priorities } from "~/utils/requests";
const props = defineProps<{ priority: RequestPriority }>();
const label = computed(
  () => priorities.find((p) => p.value === props.priority)!.label,
);
</script>
<template>
  <span class="priority-badge" :class="'priority-' + priority"
    ><svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      stroke-width="1.333333"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path
        v-if="priority === 'high'"
        d="m4.667 7.333 3.333-3.333 3.333 3.333 M4.667 12 8 8.667 11.333 12"
      />
      <path
        v-else-if="priority === 'urgent'"
        d="M8 2 1.3 13.3h13.4L8 2z M8 6.7v2.6 M8 11h.01"
      />
      <path v-else-if="priority === 'medium'" d="M3.3 6h9.4 M3.3 10h9.4" />
      <path v-else d="m4.7 4 3.3 4L11.3 4 M4.7 8 8 12l3.3-4" /></svg
    >{{ label }}</span
  >
</template>
