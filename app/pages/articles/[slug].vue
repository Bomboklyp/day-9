<script setup lang="ts">
import { formatContentDate } from "#shared/utils/content-date";
definePageMeta({ layout: "public" });
const route = useRoute();
const { data, error } = await useArticle(() => String(route.params.slug));
if (error.value || !data.value)
  throw createError({
    statusCode: error.value?.statusCode === 404 ? 404 : 503,
    statusMessage: "Article unavailable",
    data: { entity: "article" },
    fatal: true,
  });
const article = data.value.data;
const updated = formatContentDate(article.updatedAt);
usePageSeo(
  `${article.title} — WorkFlow`,
  article.description,
  `/articles/${article.slug}`,
  "article",
);
useSeoMeta({ articleModifiedTime: article.updatedAt });
</script>
<template>
  <article class="public-content public-article">
    <h1>{{ article.title }}</h1>
    <p class="page-subtitle">
      {{ article.category }} · Обновлено {{ updated }}
    </p>
    <div class="panel article-body">
      <section v-for="section in article.sections" :key="section.title">
        <h2>{{ section.title }}</h2>
        <p>{{ section.text }}</p>
      </section>
      <LazyArticleFeedback hydrate-on-visible :slug="article.slug" />
    </div>
  </article>
</template>
