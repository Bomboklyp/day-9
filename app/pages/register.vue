<script setup lang="ts">
import { apiErrorMessage } from "~/utils/api";
definePageMeta({ layout: "public" });
useHead({ title: "Регистрация — WorkFlow" });
const { register } = useAuth();
const form = reactive({ name: "", company: "", email: "", password: "" });
const busy = ref(false),
  error = ref("");
async function submit() {
  if (busy.value) return;
  busy.value = true;
  error.value = "";
  try {
    await register(form);
    form.password = "";
    await navigateTo("/requests");
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
      <h1>Создать аккаунт</h1>
      <p class="page-subtitle">Зарегистрируйтесь, чтобы отправлять заявки</p>
      <label class="field" for="register-name"
        ><span>Имя</span
        ><input
          id="register-name"
          v-model="form.name"
          required
          minlength="2"
          maxlength="80"
          autocomplete="name"
          placeholder="Мария Смирнова"
      ></label>
      <label class="field" for="register-company"
        ><span>Компания</span
        ><input
          id="register-company"
          v-model="form.company"
          required
          minlength="2"
          maxlength="150"
          autocomplete="organization"
          placeholder="АО «Вектор»"
      ></label>
      <label class="field" for="register-email"
        ><span>Электронная почта</span
        ><input
          id="register-email"
          v-model="form.email"
          required
          type="email"
          autocomplete="email"
          placeholder="0000@mail.demo"
      ></label>
      <label class="field" for="register-password"
        ><span>Пароль</span
        ><input
          id="register-password"
          v-model="form.password"
          required
          minlength="8"
          maxlength="200"
          type="password"
          autocomplete="new-password"
          placeholder="••••••••••"
      ></label>
      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <button
        class="button button-primary align-start"
        type="submit"
        :disabled="busy"
      >
        {{ busy ? "Создаём аккаунт…" : "Зарегистрироваться" }}
      </button>
      <NuxtLink to="/login" class="login-registration"
        >Уже есть аккаунт? Войти</NuxtLink
      >
    </form>
  </section>
</template>
