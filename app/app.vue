<script setup lang="ts">
import latinFont from "@fontsource-variable/montserrat/files/montserrat-latin-wght-normal.woff2?url";
import cyrillicFont from "@fontsource-variable/montserrat/files/montserrat-cyrillic-wght-normal.woff2?url";
useHead({
  link: [latinFont, cyrillicFont].map((href) => ({
    rel: "preload",
    as: "font",
    type: "font/woff2",
    crossorigin: "anonymous",
    href,
  })),
});
</script>
<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator color="#6458e8" />
    <NuxtLayout><NuxtPage /></NuxtLayout>
  </div>
</template>
