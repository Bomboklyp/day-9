<script setup lang="ts">
const { data, error, refresh } = await useAdminCatalog("categories");
useHead({ title: "Категории — WorkFlow" });
</script>
<template>
  <div class="page-stack">
    <h1>Категории</h1>
    <RequestState
      v-if="error"
      state="error"
      title="Не удалось загрузить справочник"
      @retry="refresh"
    />
    <ul v-else class="panel catalog-list">
      <li v-for="item in data ?? []" :key="item.id">
        <span>{{ item.name }}</span><span class="muted">{{ item.detail }}</span>
      </li>
    </ul>
  </div>
</template>
