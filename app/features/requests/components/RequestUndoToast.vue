<script setup lang="ts">
import { useRequestUiStore } from "../state/requestUi";
import { useRequestActions } from "../composables/useRequestActions";
const ui = useRequestUiStore();
const route = useRoute();
const { undoLastChange } = useRequestActions();
</script>
<template>
  <div v-if="ui.undo && !route.path.startsWith('/requests')" class="toast">
    <span>Изменение заявки #{{ ui.undo.id }} сохранено</span>
    <button
      class="button button-secondary"
      :disabled="!!ui.pending[ui.undo.id]"
      @click="undoLastChange"
    >
      Отменить изменение
    </button>
  </div>
</template>
