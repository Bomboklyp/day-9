<script setup lang="ts">
withDefaults(defineProps<{ name: string; size?: number }>(), { size: 20 });
const paths: Record<string, string> = {
  dashboard: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  requests:
    "M8 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3 M9 2h6v4H9z M8 12h8 M8 16h5",
  user: "M20 21v-2a7 7 0 0 0-14 0v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
  search: "M21 21l-5-5 M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15",
  plus: "M12 5v14 M5 12h14",
  arrow: "M5 12h14 M13 6l6 6-6 6",
  chevron: "M9 5l7 7-7 7",
  down: "M6 9l6 6 6-6",
  close: "M6 6l12 12 M6 18 18 6",
  menu: "M4 6h16 M4 12h16 M4 18h16",
  check: "M5 12l4 4L19 6",
  clock: "M12 8v5l3 2 M21 12a9 9 0 1 0-18 0 9 9 0 0 0 18 0",
  calendar: "M4 5h16v16H4z M16 3v4 M8 3v4 M4 11h16",
  logout: "M9 4H4v16h5 M10 12h11 M17 8l4 4-4 4",
  help: "M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4 M12 17h.01 M21 12a9 9 0 1 0-18 0 9 9 0 0 0 18 0",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4",
  list: "M9 6h12 M9 12h12 M9 18h12 M3 6h.01 M3 12h.01 M3 18h.01",
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  filter: "M4 7h16 M7 12h10 M10 17h4",
  refresh:
    "M20 7v5h-5 M4 17v-5h5 M6.1 7a7 7 0 0 1 11.5-2L20 8 M4 16l2.4 3A7 7 0 0 0 18 17",
  empty: "M8 3h8l5 8v9H3v-9z M3 12h6l1 3h4l1-3h6",
  warning: "M21 12a9 9 0 1 0-18 0 9 9 0 0 0 18 0 M12 8v4 M12 16h.01",
  message:
    "M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z",
  mail: "M3 5h18v14H3z M3 6l9 7 9-7",
  lock: "M5 10h14v11H5z M8 10V6a4 4 0 0 1 8 0v4",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12 M15 12a3 3 0 1 0-6 0 3 3 0 0 0 6 0",
  sparkles: "M12 3l2.7 6.3L21 12l-6.3 2.7L12 21l-2.7-6.3L3 12l6.3-2.7L12 3z",
  trend: "M3 17l6-6 4 4 8-10 M15 5h6v6",
  shield: "M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3z M8 12l3 3 5-6",
  send: "M22 2 9 15 M22 2l-7 20-6-7-7-6L22 2z",
  briefcase: "M3 7h18v14H3z M8 7V3h8v4 M3 12l9 4 9-4",
  flag: "M4 22V3 M4 3c5-4 10 4 16 0v11c-6 4-11-4-16 0",
  bolt: "M13 2 3 14h8l-1 8L21 9h-8l0-7z",
  arrowUp: "M12 19V5 M5 12l7-7 7 7",
};
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    class="icon"
  >
    <path :d="paths[name] || paths.requests" />
  </svg>
</template>
