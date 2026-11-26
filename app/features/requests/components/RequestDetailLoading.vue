<script setup lang="ts">
const groups = [3, 7, 3];
</script>
<template>
  <div
    class="detail-loading"
    role="status"
    aria-label="Загрузка заявки"
    aria-busy="true"
  >
    <p class="muted">Загружаем заявку…</p>
    <div class="detail-columns" aria-hidden="true">
      <div class="detail-main">
        <section
          v-for="(count, index) in groups"
          :key="index"
          class="panel detail-skeleton-panel"
        >
          <div
            v-for="number in count"
            :key="number"
            class="detail-skeleton-bar"
            :class="{ 'skeleton-short': number === 1 }"
          />
        </section>
      </div>
      <aside class="panel detail-skeleton-panel">
        <div
          v-for="number in 9"
          :key="number"
          class="detail-skeleton-bar"
          :class="{ 'skeleton-short': number === 1 }"
        />
      </aside>
    </div>
  </div>
</template>
