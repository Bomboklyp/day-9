<script setup lang="ts">
import { useRequestUiStore } from "~/features/requests/state/requestUi";
const auth = useAuth();
const requestUi = useRequestUiStore();
watch(auth.version, () => requestUi.$reset(), {
  immediate: true,
  flush: "sync",
});
const { persistenceAvailable, profile, hydrate } = useWorkflow();
onMounted(hydrate);
</script>
<template>
  <div
    class="app-shell"
    :class="{ 'density-compact': profile.density === 'compact' }"
  >
    <a class="skip-link" href="#main-content">Перейти к содержимому</a
    ><AppHeader />
    <main id="main-content" class="main-content" tabindex="-1">
      <p v-if="!persistenceAvailable" class="form-error" role="status">
        Хранилище браузера недоступно. Изменения сохранятся до перезагрузки.
      </p>
      <slot />
    </main>
    <div
      class="toast-region"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <RequestUndoToast /><LazyAppToast />
    </div>
  </div>
</template>
