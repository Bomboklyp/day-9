<script setup lang="ts">
const route = useRoute();
const menuOpen = ref(false);
const loginPage = computed(() => ["/login", "/register"].includes(route.path));
</script>
<template>
  <div class="public-layout" :class="{ 'auth-layout': loginPage }">
    <a class="skip-link" href="#main-content">Перейти к содержимому</a>
    <header v-if="loginPage" class="auth-header"><AppLogo /></header>
    <header v-else class="public-header">
      <AppLogo />
      <nav class="public-nav" aria-label="Публичная навигация">
        <NuxtLink to="/">Главная</NuxtLink
        ><NuxtLink to="/articles">Статьи</NuxtLink
        ><NuxtLink to="/help">Помощь</NuxtLink
        ><NuxtLink to="/faq">FAQ</NuxtLink>
      </nav>
      <NuxtLink to="/login" class="button button-secondary">Войти</NuxtLink
      ><button
        class="menu-button"
        type="button"
        aria-label="Открыть меню"
        @click="menuOpen = true"
      >
        <AppIcon name="menu" :size="20" />
      </button>
    </header>
    <main id="main-content" tabindex="-1"><slot /></main>
    <footer v-if="route.path === '/'" class="public-footer">
      <span>WorkFlow © 2026</span
      ><span
        ><NuxtLink to="/help">Помощь</NuxtLink> ·
        <NuxtLink to="/faq">FAQ</NuxtLink></span
      >
    </footer>
    <LazyAppModal
      v-if="menuOpen"
      :open="menuOpen"
      title="WorkFlow"
      @close="menuOpen = false"
      ><nav class="mobile-nav" aria-label="Публичное меню">
        <NuxtLink to="/" @click="menuOpen = false">Главная</NuxtLink
        ><NuxtLink to="/articles" @click="menuOpen = false">Статьи</NuxtLink
        ><NuxtLink to="/help" @click="menuOpen = false">Помощь</NuxtLink
        ><NuxtLink to="/faq" @click="menuOpen = false">FAQ</NuxtLink>
      </nav></LazyAppModal
    >
  </div>
</template>
