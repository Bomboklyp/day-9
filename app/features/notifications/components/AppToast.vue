<script setup lang="ts">
import { useToast } from "~/features/notifications/composables/useToast";
const { toast } = useToast();
</script>
<template>
  <Transition name="toast"
    ><div v-if="toast" :key="toast.id" class="toast">
      <span class="toast-check"><AppIcon name="check" :size="18" /></span
      ><span>{{ toast.message }}</span
      ><button
        class="icon-button"
        aria-label="Закрыть уведомление"
        @click="toast = null"
      >
        <AppIcon name="close" :size="16" />
      </button></div
  ></Transition>
</template>
