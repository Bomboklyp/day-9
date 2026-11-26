<script setup lang="ts">
const { user } = useAuth();
const admin = computed(() => user.value?.role === "Admin");
const { currentPerson, profile } = useWorkflow();
const menuOpen = ref(false);
const nav = ref<HTMLElement>();
function keydown(event: KeyboardEvent) {
  const items = Array.from(
    nav.value?.querySelectorAll<HTMLAnchorElement>("a") ?? [],
  );
  const index = items.indexOf(document.activeElement as HTMLAnchorElement);
  if (
    index < 0 ||
    ![
      "ArrowRight",
      "ArrowLeft",
      "ArrowDown",
      "ArrowUp",
      "Home",
      "End",
    ].includes(event.key)
  )
    return;
  event.preventDefault();
  const next =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? items.length - 1
        : (index +
            (["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1) +
            items.length) %
          items.length;
  items[next]?.focus();
}
watch(
  () => useRoute().fullPath,
  () => (menuOpen.value = false),
);
</script>
<template>
  <header class="app-header" :class="{ 'admin-header': admin }">
    <AppLogo />
    <nav
      ref="nav"
      class="app-nav"
      aria-label="Основная навигация"
      @keydown="keydown"
    >
      <NuxtLink to="/dashboard">Обзор</NuxtLink
      ><NuxtLink to="/requests">Заявки</NuxtLink>
      <template v-if="admin"
        ><NuxtLink to="/admin/users">Пользователи</NuxtLink
        ><NuxtLink to="/admin/categories">Категории</NuxtLink
        ><NuxtLink to="/admin/sla">SLA</NuxtLink
        ><NuxtLink to="/admin/analytics">Аналитика</NuxtLink></template
      >
    </nav>
    <NotificationBell />
    <NuxtLink to="/profile" class="avatar-link" aria-label="Мой профиль"
      ><PersonAvatar :person="currentPerson" /></NuxtLink
    ><span class="header-role">{{ profile.position }}</span
    ><button
      class="menu-button"
      type="button"
      aria-label="Открыть меню"
      :aria-expanded="menuOpen"
      @click="menuOpen = true"
    >
      <AppIcon name="menu" :size="20" />
    </button>
  </header>
  <AppModal :open="menuOpen" title="WorkFlow" @close="menuOpen = false"
    ><nav class="mobile-nav" aria-label="Навигация">
      <NuxtLink to="/dashboard" @click="menuOpen = false">Обзор</NuxtLink
      ><NuxtLink to="/requests" @click="menuOpen = false">Заявки</NuxtLink
      ><NuxtLink to="/profile" @click="menuOpen = false">Профиль</NuxtLink
      ><template v-if="admin"
        ><NuxtLink to="/admin/users" @click="menuOpen = false">Пользователи</NuxtLink
        ><NuxtLink to="/admin/categories" @click="menuOpen = false">Категории</NuxtLink
        ><NuxtLink to="/admin/sla" @click="menuOpen = false">SLA</NuxtLink
        ><NuxtLink to="/admin/analytics" @click="menuOpen = false">Аналитика</NuxtLink></template
      ><NuxtLink to="/" @click="menuOpen = false">Главная</NuxtLink>
    </nav></AppModal
  >
</template>
