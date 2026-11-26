<script setup lang="ts">
definePageMeta({ layout: false });
useHead({ title: "Нет доступа — WorkFlow" });
</script>
<template>
  <main class="global-error forbidden-page">
    <section class="error-content">
      <p class="error-code">403</p>
      <h1>Нет доступа</h1>
      <p>Эта страница недоступна вашей роли.</p>
      <NuxtLink to="/requests" class="button button-primary"
        >Вернуться к заявкам</NuxtLink
      >
    </section>
  </main>
</template>
