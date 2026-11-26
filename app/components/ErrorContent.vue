<script setup lang="ts">
withDefaults(defineProps<{ code?: number }>(), { code: 404 });
</script>
<template>
  <section class="error-content">
    <p class="error-code">{{ code }}</p>
    <h1>{{ code === 404 ? "Страница не найдена" : "Произошла ошибка" }}</h1>
    <p class="page-subtitle">Проверьте адрес или вернитесь к заявкам.</p>
    <button
      class="button button-primary"
      @click="clearError({ redirect: '/requests' })"
    >
      Вернуться к заявкам
    </button>
  </section>
</template>
