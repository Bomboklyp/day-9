<script setup lang="ts">
import { questions } from "#shared/data/help";
definePageMeta({ layout: "public" });
const { search } = usePublicSearch();
const matches = computed(() =>
  questions.filter((item) =>
    `${item.question} ${item.answer}`
      .toLocaleLowerCase("ru")
      .includes(search.value.trim().toLocaleLowerCase("ru")),
  ),
);
usePageSeo(
  "Частые вопросы — WorkFlow",
  "Ответы на частые вопросы о WorkFlow: создание заявок, статусы обращений, ожидание, подтверждение решения и SLA.",
  "/faq",
);
useSeoMeta({
  robots: computed(() => (search.value ? "noindex,follow" : "index,follow")),
});
useHead(() => ({
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: matches.value.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      }),
    },
  ],
}));
</script>
<template>
  <div class="public-content faq-page">
    <h1>Частые вопросы</h1>
    <p class="page-subtitle">Ответы о работе с сервисными заявками</p>
    <label class="field"
      ><span>Поиск по вопросам</span
      ><input
        v-model="search"
        type="search"
        placeholder="Что вы хотите узнать?"
    ></label>
    <section
      v-for="item in matches"
      :key="item.question"
      class="panel faq-answer"
    >
      <h3>{{ item.question }}</h3>
      <p>{{ item.answer }}</p>
    </section>
    <section v-if="!matches.length" class="panel public-empty">
      <h2>Ничего не найдено</h2>
      <button class="button button-secondary align-start" @click="search = ''">
        Сбросить поиск
      </button>
    </section>
  </div>
</template>
