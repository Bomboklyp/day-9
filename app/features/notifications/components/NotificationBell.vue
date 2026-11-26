<script setup lang="ts">
import { useNotifications } from "../composables/useNotifications";
useNotifications(true);
</script>
<template>
  <NuxtLink
    to="/notifications"
    class="header-bell notification-bell"
    aria-label="Уведомления"
    ><AppIcon name="bell" :size="20"
  /></NuxtLink>
</template>
