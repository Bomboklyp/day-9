<script setup lang="ts">
import { helpCategories } from "#shared/data/help";
const props = defineProps<{ mode: "help" | "articles" }>();
const { search, category } = usePublicSearch();
const { data, error, refresh } = await useArticles();
const matches = computed(() =>
  (data.value?.data ?? []).filter(
    (article) =>
      (!category.value || article.categoryId === category.value) &&
      `${article.title} ${article.description}`
        .toLocaleLowerCase("ru")
        .includes(search.value.trim().toLocaleLowerCase("ru")),
  ),
);
const title = props.mode === "help" ? "Центр помощи" : "Статьи и инструкции";
usePageSeo(
  `${title} — WorkFlow`,
  props.mode === "help"
    ? "Центр помощи WorkFlow: начало работы, статусы обращений, комментарии и инструкции для пользователей."
    : "Статьи и инструкции WorkFlow: как создать заявку, отслеживать обращение, добавить комментарий и проверить решение.",
  props.mode === "help" ? "/help" : "/articles",
);
useSeoMeta({
  robots: computed(() =>
    search.value || category.value ? "noindex,follow" : "index,follow",
  ),
});
</script>
<template>
  <div class="knowledge-page public-content">
    <h1>{{ title }}</h1>
    <p class="page-subtitle">Найдите ответ или отправьте обращение</p>
    <label class="field"
      ><span>Поиск</span
      ><input v-model="search" type="search" placeholder="Поиск по базе знаний"
    ></label>
    <div class="help-categories">
      <section
        v-for="item in helpCategories"
        :key="item.id"
        class="panel help-category"
      >
        <h2>{{ item.title }}</h2>
        <p>{{ item.description }}</p>
        <NuxtLink
          :to="
            item.id === 'timing'
              ? '/faq?q=SLA'
              : `/articles?category=${item.id}`
          "
          class="button button-tertiary align-start"
          :aria-label="`Открыть: ${item.title}`"
          >Открыть</NuxtLink
        >
      </section>
    </div>
    <h2>{{ mode === "help" ? "Популярные инструкции" : "Все статьи" }}</h2>
    <div v-if="error" class="panel public-empty">
      <p>Не удалось загрузить статьи.</p>
      <button class="button button-secondary" @click="refresh()">
        Повторить
      </button>
    </div>
    <div v-else-if="!matches.length" class="panel public-empty">
      <h2>Ничего не найдено</h2>
      <p>Попробуйте изменить запрос.</p>
      <NuxtLink to="/articles" class="button button-secondary"
        >Сбросить поиск</NuxtLink
      >
    </div>
    <ArticleCard
      v-for="article in matches"
      v-else
      :key="article.slug"
      :article="article"
    />
    <NuxtLink
      v-if="mode === 'help'"
      to="/requests/new"
      class="button button-primary align-start"
      >Создать заявку</NuxtLink
    >
  </div>
</template>
