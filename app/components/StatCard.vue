<script setup lang="ts">
defineProps<{ label: string; value: number | string; description?: string }>();
</script>
<template>
  <article class="stat-card panel">
    <p class="stat-label">{{ label }}</p>
    <strong class="stat-value">{{ value }}</strong>
    <p v-if="description" class="stat-description">{{ description }}</p>
  </article>
</template>
