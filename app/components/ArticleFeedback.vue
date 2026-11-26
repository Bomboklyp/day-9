<script setup lang="ts">
const props = defineProps<{ slug: string }>();
const saved = useCookie<"yes" | "no" | null>(
  `workflow-article-vote-${props.slug}`,
  { default: () => null, sameSite: "lax", maxAge: 30 * 86400 },
);
const vote = ref<"yes" | "no" | null>(null);
onMounted(() => {
  vote.value =
    saved.value === "yes" || saved.value === "no" ? saved.value : null;
});
function choose(value: "yes" | "no") {
  vote.value = value;
  saved.value = value;
}
</script>
<template>
  <div class="article-feedback">
    <h3>Была ли статья полезна?</h3>
    <div class="feedback-buttons">
      <button
        class="button button-secondary"
        :aria-pressed="vote === 'yes'"
        @click="choose('yes')"
      >
        Да</button
      ><button
        class="button button-secondary"
        :aria-pressed="vote === 'no'"
        @click="choose('no')"
      >
        Нет
      </button>
    </div>
    <p v-if="vote" class="field-hint" role="status">Спасибо за ответ.</p>
  </div>
</template>
