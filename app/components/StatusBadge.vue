<script setup lang="ts">
import type { RequestStatus } from "~/types/workflow";
import { statuses } from "~/utils/requests";
const props = defineProps<{ status: RequestStatus }>();
const option = computed(() => statuses.find((s) => s.value === props.status)!);
</script>
<template>
  <span class="status-badge" :class="'status-' + option.color"
    ><span class="status-dot" aria-hidden="true" />{{ option.label }}</span
  >
</template>
