<script setup lang="ts">
import type { TimelineEvent } from "~/types/workflow";
defineProps<{ events: TimelineEvent[] }>();
const time = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Moscow",
  }).format(new Date(value));
</script>
<template>
  <ol class="timeline">
    <li v-for="event in events" :key="event.id">
      <time :datetime="event.createdAt">{{ time(event.createdAt) }}</time>&nbsp;
      {{ event.title }}
    </li>
  </ol>
</template>
