<script setup lang="ts">
const props = defineProps<{
  error: { statusCode?: number; message?: string; data?: { entity?: string } };
}>();
const article = props.error.data?.entity === "article";
useSeoMeta({
  description: article
    ? "Возможно, статья удалена или её адрес изменился."
    : "Запрошенная страница WorkFlow не найдена.",
});
const publicError =
  props.error.statusCode === 404 && props.error.data?.entity !== "request";
useHead({
  title: article
    ? "Статья не найдена — WorkFlow"
    : "Страница не найдена — WorkFlow",
  meta: [{ name: "robots", content: "noindex,nofollow" }],
});
</script>
<template>
  <NuxtLayout v-if="publicError" name="public">
    <div class="public-error">
      <section class="error-content">
        <p class="error-code">404</p>
        <h1>{{ article ? "Статья не найдена" : "Страница не найдена" }}</h1>
        <p class="page-subtitle">
          {{
            article
              ? "Возможно, статья удалена или её адрес изменился."
              : "Проверьте адрес или вернитесь на главную."
          }}
        </p>
        <a class="button button-primary" :href="article ? '/articles' : '/'">{{
          article ? "К списку статей" : "На главную"
        }}</a>
      </section>
    </div>
  </NuxtLayout>
  <main v-else class="global-error">
    <ErrorContent :code="props.error.statusCode ?? 500" />
  </main>
</template>
