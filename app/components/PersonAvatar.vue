<script setup lang="ts">
import type { Person } from "~/types/workflow";
defineProps<{ person: Person; size?: string }>();
</script>
<template>
  <span class="avatar" :title="person.name" aria-hidden="true">{{
    person.initials
  }}</span>
</template>
