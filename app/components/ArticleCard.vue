<script setup lang="ts">
import type { ArticleSummary } from "#shared/types/content";
defineProps<{ article: ArticleSummary }>();
</script>
<template>
  <NuxtLink :to="`/articles/${article.slug}`" class="panel article-card">
    <h3>{{ article.title }}</h3>
    <p>Работа с заявками · {{ article.minutes }} минуты</p>
  </NuxtLink>
</template>
