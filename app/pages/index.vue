<script setup lang="ts">
definePageMeta({ layout: "public" });
usePageSeo(
  "WorkFlow — поддержка, в которой ничего не теряется",
  "WorkFlow объединяет заявки, команду и историю общения. Создавайте обращения и следите за их решением.",
  "/",
);
const features = [
  {
    title: "Все обращения рядом",
    text: "Статусы, приоритеты и история общения.",
  },
  {
    title: "Понятная ответственность",
    text: "У каждой заявки есть исполнитель.",
  },
  { title: "Контроль сроков", text: "Сроки реакции и решения всегда видны." },
];
</script>
<template>
  <div class="landing-page">
    <section class="hero">
      <div class="hero-row">
        <div class="hero-copy">
          <p class="eyebrow">ЗАЯВКИ · КОМАНДА · РЕЗУЛЬТАТ</p>
          <h1>Поддержка, в которой<br >ничего не теряется</h1>
          <p class="hero-description">
            От первого обращения до решения — управляйте заявками, назначайте
            исполнителей и держите сроки под контролем.
          </p>
          <NuxtLink to="/login" class="button button-primary align-start"
            >Начать работу</NuxtLink
          >
        </div>
        <picture class="hero-picture"
          ><source srcset="/images/octagon-480.webp" type="image/webp" >
          <img
            class="hero-art"
            src="/images/octagon.png"
            width="480"
            height="480"
            alt=""
            fetchpriority="high"
            decoding="async"
            loading="eager"
        ></picture>
      </div>
      <ol class="workflow-steps">
        <li class="panel">01&nbsp; Создайте заявку</li>
        <li class="panel">02&nbsp; Назначьте исполнителя</li>
        <li class="panel">03&nbsp; Подтвердите решение</li>
      </ol>
    </section>
    <section id="features" class="features-section">
      <h2>Одна система для всей команды</h2>
      <div class="feature-grid">
        <article
          v-for="(feature, index) in features"
          :id="index === 1 ? 'help' : index === 2 ? 'faq' : undefined"
          :key="feature.title"
          class="panel"
        >
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.text }}</p>
        </article>
      </div>
    </section>
  </div>
</template>
