<script setup lang="ts">
import { apiErrorMessage } from "~/utils/api";
definePageMeta({ layout: "public" });
useHead({ title: "Вход — WorkFlow" });
const { login } = useAuth();
const route = useRoute();
const email = ref(""),
  password = ref(""),
  busy = ref(false),
  error = ref("");
async function submit() {
  if (busy.value) return;
  busy.value = true;
  error.value = "";
  try {
    await login(email.value, password.value);
    password.value = "";
    const redirect =
      typeof route.query.redirect === "string" &&
      route.query.redirect.startsWith("/") &&
      !route.query.redirect.startsWith("//") &&
      !route.query.redirect.includes("\\")
        ? route.query.redirect
        : "/requests";
    await navigateTo(redirect);
  } catch (cause: unknown) {
    error.value = apiErrorMessage(cause);
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <section class="login-section">
    <form class="panel login-card" @submit.prevent="submit">
      <h1>С возвращением</h1>
      <p class="page-subtitle">Войдите для работы с заявками</p>
      <p v-if="route.query.expired" class="api-notice" role="status">
        Сессия истекла. Войдите снова, чтобы продолжить работу.
      </p>
      <label class="field" for="login-email"
        ><span>Электронная почта</span
        ><input
          id="login-email"
          v-model="email"
          type="email"
          required
          autocomplete="username"
          placeholder="0000@mail.demo"
      ></label>
      <label class="field" for="login-password"
        ><span>Пароль</span
        ><input
          id="login-password"
          v-model="password"
          type="password"
          required
          autocomplete="current-password"
          placeholder="••••••••••"
      ></label>
      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <button
        class="button button-primary align-start"
        type="submit"
        :disabled="busy"
      >
        {{ busy ? "Входим…" : "Войти" }}
      </button>
      <NuxtLink to="/register" class="login-registration"
        >Нет аккаунта? Зарегистрироваться</NuxtLink
      >
    </form>
  </section>
</template>
